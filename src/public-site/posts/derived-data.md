# Derived Data - Notes on Design DataIntentinse application

## Motivation

As a software engineer, ....

---

## Introduction

Derived data is everywhere because the data or raw data is very raw and hard to read or even process or visualize. Eventually, the data has to be derived and output can be in different format. 

1. System of Records - source of truth - generaly normalized - not necessary database it can be anything
2. Derived data - redundant data- usually denormalized

---

## Processing

1. **Services - online mode**
- simple request and response 
- services try to respond as quickly as possible - latency matters
- many works like this

2. **batch processing - offline mode**
- some input data has to be processed to get the output data which can take lot of time.
- does not make sense to let the user to wait for it 
- runs the job which can take many times - run daily or weekly or however
- throughput is performance metrics - time taken to do on certain fixed amount of input data

3. **stream processing - on and off mode**
- in between services and batch batch processing
- should not respond the request, but rather, quickly run the process of while batch process works on particular ste of data, after as soon as it gets it
---

## Batch Processing



**Credit**: This post was cleaned up and organized from my rough notes with help from LLM — but the thought process, steps, and structure reflect how I personally reason through system design.
