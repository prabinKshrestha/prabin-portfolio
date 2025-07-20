# System Design of News Feed

## Motivation

As a software engineer, I'm deeply interested in how large-scale systems operate behind the scenes. While coding is critical, understanding system architecture is just as important — especially for building scalable, reliable applications.

To explore this further, I started reading *System Design Interview – An Insider's Guide* by Alex Xu. One chapter focuses on building a **news feed** system, a core part of most social media platforms. I decided not to just take notes but to write my **own walkthrough** of how such a system could be designed — step by step, improving iteratively. This helps me reason deeply, challenge assumptions, and learn more effectively.

---

## Introduction

Social media platforms like Facebook, Instagram, and LinkedIn all display a **news feed** — a continuous stream of content posted by friends, followers, or connections. These posts can be text, images, videos, or links, and are often presented in various formats, priorities, or languages.

The central challenge is this:

> **How do we deliver fresh, personalized content to millions of users in near real-time — efficiently and reliably?**

In this write-up, I’ll walk through designing such a system from the ground up, refining it along the way. I’ll start with a basic version, point out flaws, and gradually improve each component to handle scale, latency, and complexity — just like we'd do in a real system design discussion.

---

## Requirements

I’m not going to mimic the interview-style requirement gathering from the book. Instead, I’ll define a basic set of assumptions:

* The system should support **50 million users**
* Users can create posts (text, images, videos)
* Users have followers, and a post should appear in the followers' news feed
* The news feed should show **recent** content in **reverse chronological order** - even though we can think of weight based order
* We’ll prioritize **freshness over relevance** (i.e., no ranking based on engagement or affinity for now)
* The system should support both **mobile** and **web** clients
* Latency should be low, especially when fetching feeds



## Step 1: The Naive Approach — Start Simple

Let’s say we start small. One user creates a post. Their followers see that post in their feed. Sounds straightforward.

### Components:

* A **Web Server** to handle requests
* A **Posts Database** to store posts
* A **Users Database** to store users
* Two simple APIs:

  * `POST /users/{id}/posts` — to create a post
  * `GET /users/{id}/feed` — to fetch the feed

In this setup:

* The `POST` request inserts the post into the Posts DB
* The `GET` request:

  * Retrieves the list of users that the requester follows
  * Fetches recent posts from those users
  * Sorts them in reverse chronological order

### Problem?

It works — *but only at small scale*. Once the number of users, followers, and posts grows, this system starts falling apart:

* One **Web Server** becomes a bottleneck
* Queries to fetch feeds involve **multiple joins** and **large reads** from the database
* **Latency increases** and **reliability decreases**

---

## Step 2: Add Scale and Redundancy

To solve the reliability and scalability issue:

* Add a **Load Balancer** in front of the Web Servers
* **Horizontally scale** Web Servers to handle concurrent traffic

This improves uptime and balances the load across machines.

### Still Not Enough

Even with consideration of scalability, the database becomes a **hotspot**. Every user request to fetch their feed results in:

* Reading follower lists
* Fetching hundreds of posts
* Sorting and filtering them

Each of these actions adds **latency**.

---

## Step 3: Introduce Caching — Reduce DB Load

We now introduce **caching** to speed things up.

### What to cache?

* **Feed Cache**: For each user, store a list of **recent post IDs** `<follower_id, post_id>` they should see
* **Post Cache**: For each post ID, store **post content** (text, media URLs, etc.)
* **Users Cache**: For each user ID, store **user relevant information** 
    * Store user metadata, preferences, mute/block lists
    * Useful when generating customized feeds or applying filters

This changes the `POST /users/{id}/posts` flow:

1. Get followers of the user from users table - or even improve using cache - we'll talk about this later
2. Create  **Feed Cache**  
3. Create **Post Cache**

This changes the `GET /users/{user_id}/feed` flow:

1. Fetch the list of post IDs from the **Feed Cache**
2. Retrieve post content from **Post Cache**
3. Retrieve user information from **Users Cache**
4. Process the news feed to return by filtering out for particular user.
5. If any cache is missing, **fallback to the DB**, and write to the cache again

This significantly reduces DB hits and improves latency.

### But Now the Problem Is...

How do we populate the feed cache? Especially when a user with thousands of followers posts something new?

If we do it **synchronously** during the post creation — i.e., write to DB and then update thousands of feed caches — it becomes **slow and error-prone**.

---

## Step 4: Decouple with Asynchronous Workers

To solve this, we decouple the write flow using a **Message Queue** and **Worker system**.

### Write Flow (Improved):

1. User creates a post → Web Server accepts it
2. Post is stored in **Posts DB**
3. A job is pushed to a **Message Queue**
4. A **Feed Worker** picks up the job:

   * Gets the list of followers
   * Updates each follower’s **Feed Cache** with the new post ID

Now, post creation is **fast and responsive**, and feed updates happen **asynchronously** in the background.

---

## Step 5: Fan-Out Strategy — Push vs Pull

At this point, we’re using a **Fan-out-on-write** strategy, also known as the **Push model**.

### Push Model:

* When a user posts, the system **pushes** the post to their followers’ feed caches
* Reads are fast, because the feed is precomputed

### But there’s a catch...

This model doesn't scale well for **celebrity users** with millions of followers. Updating that many feed caches takes time — even asynchronously.

### Alternative: Pull Model (Fan-out-on-read)

* Posts are stored once
* When a user requests their feed, we **dynamically fetch** recent posts from all the people they follow

This shifts the load to **read time** and avoids huge fan-out writes.

### What’s better?

Neither is perfect. In practice, we use a **hybrid approach**:

* Use **Push model** for regular users (less fan-out load)
* Use **Pull model** for high-follower accounts (e.g., celebs)

💡 In this design, I’m focusing on the **Push model** for its performance benefits in most common scenarios.

---

## Step 6: More Optimizations and Peripheral system consideration

To further strengthen the design, we can introduce:

### 1. **Graph DB** for Follow Relationships

* Storing followers/following in a **Graph DB** or **Redis** improves traversal speed
* Makes it efficient to fetch all followers of a user when pushing new posts

### 2. **Retries and Dead-letter Queues**

* If the Feed Worker fails, we retry the job
* If it keeps failing, move it to a **Dead Letter Queue** for inspection

### 3. **Rate Limiting**

* Prevent abusive users or clients from overloading the system

### 5. **Content Delivery Network (CDN)**

* Serve static assets like images and videos efficiently

---

## Summary

Designing a news feed system is more than just storing posts and showing them in a list. It involves **constant iteration**, **trade-offs**, and **scaling challenges**.

We started with a **simple architecture**, pointed out its flaws, and gradually improved it:

- ✅ Naive DB-centric design
- ✅ Horizontal scaling with load balancer
- ✅ Caching for reads
- ✅ Async processing with queues and workers
- ✅ Push vs Pull model trade-off
- ✅ Optimizations for scale and performance

This is my personal walkthrough of designing a **scalable news feed system**, step by step, inspired by concepts from *System Design Interview – An Insider’s Guide*.

Hope this helps anyone else trying to think through large-scale system architecture!

---

**Credit**: This post was cleaned up and organized from my rough notes with help from LLM — but the thought process, steps, and structure reflect how I personally reason through system design.
