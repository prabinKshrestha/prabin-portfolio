# Database Sharding: Scaling Databases for Large Applications

## Motivation

As a software engineer, understanding system architecture is just as important as writing code. One area that often comes up in large-scale systems is **database scaling**.

When applications grow, a single database can become a bottleneck — queries slow down, latency increases, and operational costs skyrocket. That’s where **database sharding** comes in.

I decided to write my **own walkthrough** of database sharding — how to design, implement, and operate it — in a step-by-step fashion. The goal is to reason deeply about sharding, understand its trade-offs, and explore practical approaches.

## Introduction

**Sharding** is a technique for horizontal database scaling: splitting a large database into smaller, faster, and more manageable pieces called **shards**. Each shard holds a portion of the data and operates independently, while the application or a routing layer ensures queries go to the correct shard.

Many large applications use sharding, including social media platforms, e-commerce sites, and gaming systems.

The core challenge is:

> **How do we split data across multiple databases while keeping queries correct, fast, and manageable?**

---

## Step 1: The Naive Approach — Single Database

Let’s start simple:

* One database stores all users, posts, orders, transactions, etc.
* Application servers connect to this database for all read and write operations.

This works fine when the application is small.

### Components:

* Web servers handle API requests
* A relational database stores all entities
* Application queries the database directly

### Problem?

* As data grows, queries become slower
* Heavy writes or reads can block other operations
* One database becomes a **single point of failure**
* Operational costs increase (e.g., \$5,000/month for a 600 GB database on Azure SQL)

Clearly, this naive approach doesn’t scale to millions of users or hundreds of GBs of data.

---

## Step 2: Add Replication and Read Scaling

The first improvement is **vertical scaling and replication**:

* Scale up the database server (more CPU, memory, faster disks)
* Use read replicas for read-heavy workloads

### Limitations

* Vertical scaling has limits — you can only scale so far
* Replicas help with reads but don’t solve write bottlenecks
* Eventually, a single database cannot handle the load

---

## Step 3: Introduce Sharding

Now we split the database into **smaller shards**:

* Each shard stores a subset of the data (e.g., users 1–1M in Shard1, users 1M+1–2M in Shard2)
* Each shard operates independently
* Application or a routing layer determines which shard to query

### Example Shard Key

* User ID, tenant ID, or customer ID
* A good shard key spreads data evenly and keeps related data together

---

## Step 4: Sharding Approaches

There are two main approaches to sharding:

### 1. Hash-based Sharding

* Hash the shard key (e.g., `UserId % 4` where 4 is number of shards)
* Ensures even distribution of data
* Simple and predictable

### 2. Range-based Sharding

* Divide data into ranges (e.g., users 1–1M, 1M+1–2M)
* Works well if data is naturally ordered
* Risk: “hot” ranges can overload a single shard

### 3. Directory-Based Sharding: 

* A lookup table or service maintains a mapping between the sharding key and the corresponding shard. 
* This offers flexibility but introduces another component to manage.

---

## Step 5: Application Layer Routing

Once shards exist, the application needs to know **where to send queries**:

* Use a **Shard Map Manager** — a central metadata store that maps keys to shards
* Application queries the Shard Map to find the right shard
* Then executes the query only on that shard

This minimizes unnecessary queries and reduces latency.

---

## Step 6: Cross-Shard Queries

Some queries need to fetch data across multiple shards (e.g., reporting or analytics):

* Option 1: **Application-side aggregation** — query each shard and merge results in code
* Option 2: **Elastic Query / Proxy layer** — SQL or middleware handles cross-shard queries

### Trade-offs

* Cross-shard queries are slower and more complex
* Avoid them in high-frequency paths if possible

---

## Step 7: Handling Hotspots

Sharding only works well if data is **evenly distributed**:

* Poor shard key choice can overload one shard
* Celebrity users or popular items can cause “hot shards”
* Solutions:

  * Split hot shards further
  * Use hybrid push/pull or caching

---

## Step 8: Caching

Sharding reduces DB bottlenecks, but caching improves **latency**:

* Cache frequently accessed data per shard (e.g., user profiles, posts)
* Reduce load on shards for read-heavy queries
* Cache invalidation becomes easier, as it can be done per shard

---

## Step 9: Operational Considerations

1. **Schema changes**: must apply to all shards
2. **Backups**: shard-by-shard, easier to parallelize
3. **Monitoring**: track shard sizes, query performance, hotspots
4. **Adding new shards**: use split/merge tools or consistent hashing
5. **Cost**: smaller shards can reduce per-DB cost and improve efficiency

---

## Step 10: Example — Implementing Sharding in .NET with EF Core

At this point, we’ve covered the **concepts, strategies, and trade-offs** for database sharding. Now let’s see how this could look in code, using **.NET and Entity Framework Core** to dynamically route queries to the correct shard based on a shard key (e.g., `UserId`).

This example demonstrates a **hash-based sharding strategy** and shows how to:

* Switch database connections dynamically per user
* Insert and query data in the correct shard
* Optionally perform cross-shard queries

---

### 9.1 Define Shards

We first define the shards and their connection strings:

```csharp
var shards = new Dictionary<int, string>
{
    { 0, "Server=server1;Database=Shard1Db;User Id=sa;Password=pass;" },
    { 1, "Server=server1;Database=Shard2Db;User Id=sa;Password=pass;" },
    { 2, "Server=server1;Database=Shard3Db;User Id=sa;Password=pass;" }
};
```

Each shard represents a portion of the data. The key is a shard ID, and the value is the **connection string** to that shard.

---

### 9.2 EF Core DbContext

We define a standard EF Core `DbContext` for our application entities:

```csharp
using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Post> Posts { get; set; }
}

public class User
{
    public int Id { get; set; }
    public string Name { get; set; }
}

public class Post
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Content { get; set; }
}
```

This schema will exist **identically on all shards**.

---

### 9.3 Shard Resolver

The `ShardResolver` decides **which shard a user belongs to**, using a simple hash function:

```csharp
public class ShardResolver
{
    private readonly Dictionary<int, string> _shards;

    public ShardResolver(Dictionary<int, string> shards)
    {
        _shards = shards;
    }

    public string GetConnectionStringForUser(int userId)
    {
        int shardKey = userId % _shards.Count;
        return _shards[shardKey];
    }
}
```

---

### 9.4 DbContext Factory

We can now create `DbContext` instances **dynamically for each user**:

```csharp
public class DbContextFactory
{
    private readonly ShardResolver _shardResolver;

    public DbContextFactory(ShardResolver shardResolver)
    {
        _shardResolver = shardResolver;
    }

    public AppDbContext CreateDbContextForUser(int userId)
    {
        string connStr = _shardResolver.GetConnectionStringForUser(userId);
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(connStr)
            .Options;
        return new AppDbContext(options);
    }
}
```

---

### 9.5 Using Sharded DbContext

Here’s how you can **insert and query posts** dynamically:

```csharp
var shardResolver = new ShardResolver(shards);
var dbFactory = new DbContextFactory(shardResolver);

int userId = 12345;

// Dynamically resolve the correct shard
using var dbContext = dbFactory.CreateDbContextForUser(userId);

// Insert a new post
dbContext.Posts.Add(new Post
{
    UserId = userId,
    Content = "Hello from a sharded DB!"
});
dbContext.SaveChanges();

// Query posts for this user
var posts = dbContext.Posts
    .Where(p => p.UserId == userId)
    .ToList();
```

Each user’s data is routed to the **appropriate shard automatically**.

---

### 9.6 Cross-Shard Queries (Optional)

For reporting or analytics, you might want to **aggregate data across all shards**:

```csharp
var allPosts = new List<Post>();

foreach (var connStr in shards.Values)
{
    var options = new DbContextOptionsBuilder<AppDbContext>()
        .UseSqlServer(connStr)
        .Options;

    using var ctx = new AppDbContext(options);
    allPosts.AddRange(ctx.Posts.ToList());
}

Console.WriteLine($"Total posts across all shards: {allPosts.Count}");
```

* Each shard is queried independently
* Aggregation happens in application code

---

### ✅ Takeaways

* EF Core can **dynamically switch connections** based on shard keys
* This pattern works well when you **cannot change the application logic**
* Fan-out queries can be implemented in code for cross-shard analytics
* Combined with caching and async workers, this forms the backbone of a scalable sharded database system

---

## Summary

Database sharding allows large applications to scale horizontally while keeping queries performant.

* ✅ Breaks a single massive database into manageable pieces
* ✅ Reduces latency and operational bottlenecks
* ✅ Supports high-volume read/write workloads
* ⚠️ Requires careful planning for shard keys, cross-shard queries, and operational tasks

**Key takeaways:**

* Start with a single database, add replication for read scaling
* Introduce sharding only when necessary
* Pick a good shard key to avoid hotspots
* Use caching and asynchronous processing to improve performance
* Plan operational tools: shard map, schema updates, monitoring, backups

Sharding is a **powerful but complex** solution — when done right, it enables applications to scale to millions of users and hundreds of GBs of data without bottlenecks.

---

💡 This is my personal walkthrough of **database sharding**, inspired by my experience and system design concepts. It’s written step-by-step so anyone can reason about scaling databases for large applications.

