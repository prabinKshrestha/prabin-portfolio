# RabbitMQ: A Comprehensive Guide to Enterprise Messaging

## Introduction

Modern software systems rarely exist in isolation. A typical e-commerce application might need to send emails, process payments, update inventory, and generate reports—all triggered by a single user action. But what happens when the email service is temporarily down? Should the entire order process fail?

This is where **RabbitMQ** comes in. RabbitMQ is a message broker that enables applications to communicate asynchronously. Instead of Service A directly calling Service B, they exchange messages through RabbitMQ. If Service B is temporarily unavailable, the message waits safely in a queue until Service B is ready to process it.

Think of RabbitMQ as a sophisticated post office: producers drop off messages, RabbitMQ sorts and routes them, and consumers pick them up when they're ready. This creates loosely coupled, resilient systems that can scale independently.

## Core Architecture

Understanding RabbitMQ's architecture is essential before diving into code. Let's break down the key components.

### Key Components

**Broker**: This is the RabbitMQ server process itself—the heart of the system. It receives messages from producers, stores them temporarily, and forwards them to consumers. When you install RabbitMQ and start the service, you're running a broker.

**Node**: A single instance of the RabbitMQ broker running on a physical or virtual machine. In production, you'll typically run multiple nodes to form a cluster for redundancy.

**Virtual Hosts (vhost)**: Think of virtual hosts as separate RabbitMQ environments within a single broker. They're like having multiple mini-RabbitMQ servers for different projects or teams, each with isolated queues, exchanges, and permissions. The default vhost is `/`.

**Producer**: Any application that sends messages to RabbitMQ. In our e-commerce example, the web API that receives order requests is a producer—it publishes "order created" messages.

**Consumer**: An application that receives and processes messages. This might be a background worker service that sends confirmation emails or updates inventory.

**Exchange**: The routing engine of RabbitMQ. Producers never send messages directly to queues; they send them to exchanges. The exchange then decides which queue(s) should receive the message based on routing rules. This indirection provides powerful flexibility.

**Queue**: Where messages actually live while waiting to be processed. Queues are like mailboxes—they hold messages until a consumer is ready to retrieve them.

**Binding**: The relationship between an exchange and a queue. Bindings define the rules that tell an exchange "when you receive a message matching these criteria, route it to this queue."

### The Message Flow

Every message in RabbitMQ follows this path:

```
Producer → Exchange → [Binding Rules] → Queue → Consumer
```

Here's what happens when you place an order on an e-commerce site:

1. The web API (producer) publishes an "order created" message to an exchange
2. The exchange examines the message and its routing rules
3. Based on bindings, it routes copies to relevant queues (email queue, inventory queue, analytics queue)
4. Consumers pick up messages from their respective queues and process them
5. Each consumer acknowledges successful processing, and RabbitMQ removes the message from the queue

This architecture provides several benefits:
- **Decoupling**: Producers don't know which consumers exist or how many there are
- **Resilience**: If a consumer crashes, messages remain safely in the queue
- **Scalability**: Add more consumers to process messages faster without changing producers
- **Flexibility**: Change routing rules without modifying application code

## Exchange Types

Exchanges are what make RabbitMQ powerful. Choosing the right exchange type is crucial for designing your messaging architecture. Let's explore each type with practical examples.

### 1. Direct Exchange: Precise Routing

A direct exchange routes messages to queues based on **exact routing key matches**. It's like sorting mail by zip code—each message has a routing key, and it goes only to queues bound with that exact key.

**Real-world scenario**: You're building an order processing system. When an order is created, different services need to handle different aspects:
- Payment service processes payments
- Shipping service arranges delivery
- Inventory service updates stock

You don't want the payment service receiving shipping messages or vice versa. A direct exchange solves this:

```csharp
// Declare the exchange
channel.ExchangeDeclare("orders-exchange", ExchangeType.Direct);

// Each service binds its queue with a specific routing key
channel.QueueBind("payment-queue", "orders-exchange", "orders.payment");
channel.QueueBind("shipping-queue", "orders-exchange", "orders.shipping");
channel.QueueBind("inventory-queue", "orders-exchange", "orders.inventory");

// Producer sends to specific services by choosing the routing key
channel.BasicPublish("orders-exchange", "orders.payment", null, paymentMessage);
channel.BasicPublish("orders-exchange", "orders.shipping", null, shippingMessage);
```

Only the payment queue receives messages with the `orders.payment` routing key. This provides clean separation of concerns.

**Use case**: Task-specific routing where you need precise control over which consumers receive which messages.

### 2. Fanout Exchange: Broadcasting

A fanout exchange broadcasts messages to **all bound queues**, completely ignoring routing keys. It's like a radio broadcast—everyone tuned in receives the same signal.

**Real-world scenario**: When a user registers on your platform, multiple things need to happen:
- Send a welcome email
- Create an analytics event
- Add an entry to the audit log
- Trigger a CRM workflow

All of these services need to know about the same registration event:

```csharp
channel.ExchangeDeclare("user-events", ExchangeType.Fanout);

// All services bind to the same exchange
channel.QueueBind("email-queue", "user-events", "");
channel.QueueBind("analytics-queue", "user-events", "");
channel.QueueBind("audit-queue", "user-events", "");
channel.QueueBind("crm-queue", "user-events", "");

// One publish reaches everyone
channel.BasicPublish("user-events", "", null, userRegisteredMessage);
```

Every service receives a copy of the message and can process it independently. If the email service is slow, it doesn't affect analytics or audit logging.

**Use case**: Broadcasting events where multiple independent services need to react to the same occurrence.

### 3. Topic Exchange: Pattern-Based Routing

A topic exchange routes based on **pattern matching** using wildcards. This provides flexibility between the precision of direct exchanges and the broadcasting of fanout exchanges.

Routing keys in topic exchanges use dot-separated words (e.g., `order.created.paid`), and queues can subscribe using patterns:
- `*` matches exactly one word
- `#` matches zero or more words

**Real-world scenario**: You're building a logging system that needs to handle logs from different services and severity levels:

```csharp
channel.ExchangeDeclare("logs-exchange", ExchangeType.Topic);

// Different queues for different log scenarios
channel.QueueBind("error-logs", "logs-exchange", "error.*");           // All errors
channel.QueueBind("payment-logs", "logs-exchange", "*.payment.*");     // All payment-related
channel.QueueBind("critical-alerts", "logs-exchange", "error.payment.#"); // Critical payment errors
channel.QueueBind("all-logs", "logs-exchange", "#");                   // Everything

// Publishing with descriptive routing keys
channel.BasicPublish("logs-exchange", "error.payment.timeout", null, logMessage1);
channel.BasicPublish("logs-exchange", "info.user.login", null, logMessage2);
channel.BasicPublish("logs-exchange", "error.inventory.outofstock", null, logMessage3);
```

With these bindings:
- `error.payment.timeout` → Goes to error-logs, payment-logs, critical-alerts, and all-logs
- `info.user.login` → Goes only to all-logs
- `error.inventory.outofstock` → Goes to error-logs and all-logs

This flexibility is perfect for event-driven microservices where you want consumers to self-select which events they care about.

**Use case**: Event-driven architectures, logging systems, and scenarios where you need hierarchical routing with flexible subscription patterns.

### 4. Headers Exchange: Metadata-Based Routing

A headers exchange routes based on **message headers** instead of routing keys. This is useful when routing decisions depend on multiple attributes.

**Real-world scenario**: You're processing document conversion requests with different requirements:

```csharp
var properties = channel.CreateBasicProperties();
properties.Headers = new Dictionary<string, object> {
    { "format", "pdf" },
    { "priority", "high" },
    { "size", "large" }
};

var bindArgs = new Dictionary<string, object> {
    { "x-match", "all" },  // Must match ALL headers (or "any" for ANY match)
    { "format", "pdf" },
    { "priority", "high" }
};

channel.QueueBind("urgent-pdf-queue", "headers-exchange", "", bindArgs);
channel.BasicPublish("headers-exchange", "", properties, documentData);
```

The queue only receives messages where both `format=pdf` AND `priority=high`. This is powerful but complex—use it only when simpler exchanges won't work.

**Use case**: Complex routing based on multiple message attributes (rarely needed in practice).

### The Default Exchange: A Convenient Shortcut

When you see code like this:

```csharp
channel.BasicPublish("", "task-queue", properties, body);
```

The empty string (`""`) refers to the **default exchange**. This is actually a pre-declared direct exchange with a special behavior: it automatically routes messages to queues where the routing key matches the queue name exactly.

So `channel.BasicPublish("", "payment-queue", ...)` routes directly to a queue named `payment-queue`. It's a convenient shortcut for simple point-to-point messaging, and you'll see it used frequently in basic examples and work queue patterns.

Think of it as RabbitMQ saying: "If you're not doing fancy routing, just tell me the queue name and I'll handle it."

## Queue Management

Queues are where messages actually live in RabbitMQ. Understanding queue properties and types is crucial for building reliable systems.

### Queue Declaration

When you declare a queue, you're defining its behavior:

```csharp
channel.QueueDeclare(
    queue: "payment-queue",
    durable: true,      // Survives broker restart
    exclusive: false,   // Not restricted to one connection
    autoDelete: false,  // Don't delete when consumers disconnect
    arguments: null
);
```

Let's understand each parameter:

**queue**: The queue name. If you pass an empty string, RabbitMQ generates a random name (useful for temporary queues).

**durable**: If `true`, the queue survives RabbitMQ restarts. Critical for production—you don't want to lose your queue definition if the broker restarts. However, durability alone doesn't make messages persistent (we'll cover that shortly).

**exclusive**: If `true`, only the connection that declared the queue can use it, and it's deleted when that connection closes. Useful for temporary, connection-specific queues (like in RPC patterns).

**autoDelete**: If `true`, the queue is deleted when the last consumer unsubscribes. Useful for temporary processing queues.

**arguments**: Additional configuration like dead-letter exchanges, message TTL, or queue type (classic vs quorum).

### Queue Types

RabbitMQ offers different queue types optimized for different scenarios:

**Classic Queue**: The traditional queue type, suitable for general use. It resides on a single node, though it can be mirrored to other nodes for high availability.

```csharp
// Classic queue (default)
channel.QueueDeclare("payment-queue", durable: true, false, false, null);
```

**Quorum Queue**: A newer queue type based on the Raft consensus algorithm. Messages are automatically replicated across multiple nodes, providing strong consistency and better fault tolerance.

```csharp
var args = new Dictionary<string, object> {
    { "x-queue-type", "quorum" }
};

channel.QueueDeclare("payment-queue", durable: true, false, false, args);
```

Quorum queues are the recommended choice for production systems where data loss is unacceptable. They come with slight performance overhead compared to classic queues, but the trade-off is worth it for critical data.

**When to use each**:
- **Classic queues**: Development, testing, or non-critical data where maximum throughput matters more than guarantees
- **Quorum queues**: Production systems handling orders, payments, user data, or any scenario where losing messages would be problematic

### Queue Location in Clusters

Understanding where queues physically exist in a cluster helps you reason about performance and availability:

- When you declare a queue, it's created on the node you're connected to
- In a cluster, classic queues exist on one "home" node (though they can be mirrored)
- Quorum queues are automatically distributed across multiple nodes
- Consumers can connect to any node in the cluster—RabbitMQ handles routing messages from the queue's home node to the consumer's connected node

This distributed architecture means you can lose a node and (with proper configuration) not lose any queues or messages.

## Message Patterns

Let's explore the common messaging patterns you'll use in real applications. Understanding when to use each pattern is key to designing effective systems.

### 1. Work Queue (Competing Consumers)

The work queue pattern distributes tasks across multiple workers. Each message is delivered to **exactly one consumer**—workers compete for messages.

**Real-world scenario**: Your e-commerce site sends thousands of order confirmation emails per hour. You can't send them synchronously in the web request—users would wait too long. Instead:

1. Web API receives order → saves to database → publishes "send confirmation email" message
2. Multiple worker processes pull messages from the queue
3. Each worker sends one email and grabs the next message
4. As traffic increases, you spin up more workers

**Producer (Web API):**
```csharp
var factory = new ConnectionFactory() { HostName = "localhost" };
using var connection = factory.CreateConnection();
using var channel = connection.CreateModel();

// Declare a durable queue
channel.QueueDeclare("email-queue", durable: true, false, false);

// Create a persistent message
var properties = channel.CreateBasicProperties();
properties.Persistent = true;  // Survives broker restart

var messageBody = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new
{
    To = "customer@example.com",
    OrderId = 12345,
    Template = "order-confirmation"
}));

// Publish using the default exchange
channel.BasicPublish("", "email-queue", properties, messageBody);
```

**Consumer (Worker Service):**
```csharp
channel.QueueDeclare("email-queue", durable: true, false, false);

// Fair dispatch: only send the next message after the current one is acknowledged
channel.BasicQos(prefetchSize: 0, prefetchCount: 1, global: false);

var consumer = new EventingBasicConsumer(channel);
consumer.Received += (model, ea) =>
{
    var body = ea.Body.ToArray();
    var message = Encoding.UTF8.GetString(body);
    Console.WriteLine($"Processing: {message}");
    
    try
    {
        // Simulate email sending (2 seconds)
        Thread.Sleep(2000);
        SendEmail(message);
        
        // Acknowledge successful processing
        channel.BasicAck(ea.DeliveryTag, multiple: false);
        Console.WriteLine("Email sent successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Failed to send email: {ex.Message}");
        // Reject and requeue for retry
        channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: true);
    }
};

// autoAck: false means we manually acknowledge
channel.BasicConsume("email-queue", autoAck: false, consumer);
Console.WriteLine("Worker ready. Press [enter] to exit.");
Console.ReadLine();
```

**Key characteristics**:
- **Round-robin distribution**: RabbitMQ sends message 1 to worker 1, message 2 to worker 2, etc.
- **Fair dispatch with QoS**: By setting `prefetchCount: 1`, we ensure slow workers don't get overwhelmed. A worker only receives the next message after acknowledging the current one.
- **Horizontal scaling**: Need more throughput? Just start more worker processes. No code changes required.

**Common use cases**: Background jobs, email sending, image processing, report generation, data imports, webhook delivery.

### 2. Publish/Subscribe (Fanout Pattern)

In pub/sub, one message is delivered to **multiple consumers**, each with their own queue. Unlike work queues where consumers compete, here every consumer gets every message.

**Real-world scenario**: When a user completes a purchase, multiple things need to happen simultaneously:
- Send confirmation email (Email Service)
- Record the event in analytics (Analytics Service)
- Update customer lifetime value (CRM Service)
- Log for compliance (Audit Service)

Each service operates independently—if the email service is slow, it doesn't affect analytics.

**Publisher:**
```csharp
// Declare a fanout exchange
channel.ExchangeDeclare("order-events", ExchangeType.Fanout);

var orderEvent = new
{
    OrderId = 12345,
    CustomerId = 67890,
    Total = 199.99,
    Timestamp = DateTime.UtcNow
};

var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(orderEvent));
channel.BasicPublish("order-events", routingKey: "", null, body);

Console.WriteLine("Order event published");
```

**Subscriber 1 (Email Service):**
```csharp
channel.ExchangeDeclare("order-events", ExchangeType.Fanout);

// Each service declares its own queue
channel.QueueDeclare("email-service-queue", durable: true, false, false);
channel.QueueBind("email-service-queue", "order-events", routingKey: "");

var consumer = new EventingBasicConsumer(channel);
consumer.Received += (model, ea) =>
{
    var message = Encoding.UTF8.GetString(ea.Body.ToArray());
    Console.WriteLine($"Email Service: Sending confirmation for {message}");
    channel.BasicAck(ea.DeliveryTag, false);
};

channel.BasicConsume("email-service-queue", autoAck: false, consumer);
```

**Subscriber 2 (Analytics Service):**
```csharp
channel.ExchangeDeclare("order-events", ExchangeType.Fanout);

// Separate queue for analytics
channel.QueueDeclare("analytics-queue", durable: true, false, false);
channel.QueueBind("analytics-queue", "order-events", routingKey: "");

var consumer = new EventingBasicConsumer(channel);
consumer.Received += (model, ea) =>
{
    var message = Encoding.UTF8.GetString(ea.Body.ToArray());
    Console.WriteLine($"Analytics Service: Recording event {message}");
    channel.BasicAck(ea.DeliveryTag, false);
};

channel.BasicConsume("analytics-queue", autoAck: false, consumer);
```

**Critical difference from Work Queue**:
- Work Queue: One queue, multiple workers compete for messages
- Pub/Sub: Multiple queues, each gets a copy of every message

**Common use cases**: Event broadcasting, activity streams, real-time notifications, audit logging, cache invalidation across multiple servers.

### 3. Routing Pattern (Selective Delivery with Direct Exchange)

The routing pattern allows consumers to selectively receive messages based on routing keys. It's more targeted than pub/sub but more flexible than work queues.

**Real-world scenario**: Your logging system needs to route different log levels to different destinations:
- Error logs → paging system (wakes up on-call engineer)
- Warning logs → log file for review
- Info logs → discarded or sent to analytics

```csharp
channel.ExchangeDeclare("logs", ExchangeType.Direct);

// Critical errors queue
channel.QueueDeclare("critical-queue", durable: true, false, false);
channel.QueueBind("critical-queue", "logs", routingKey: "error");

// Warnings queue
channel.QueueDeclare("warnings-queue", durable: true, false, false);
channel.QueueBind("warnings-queue", "logs", routingKey: "warning");

// All logs queue (binds to multiple routing keys)
channel.QueueDeclare("all-logs-queue", durable: true, false, false);
channel.QueueBind("all-logs-queue", "logs", routingKey: "error");
channel.QueueBind("all-logs-queue", "logs", routingKey: "warning");
channel.QueueBind("all-logs-queue", "logs", routingKey: "info");

// Publisher chooses severity
channel.BasicPublish("logs", "error", null, Encoding.UTF8.GetBytes("Database connection failed"));
channel.BasicPublish("logs", "warning", null, Encoding.UTF8.GetBytes("High memory usage"));
channel.BasicPublish("logs", "info", null, Encoding.UTF8.GetBytes("User logged in"));
```

The error message goes to both `critical-queue` and `all-logs-queue`, while info messages only go to `all-logs-queue`.

**Common use cases**: Task routing, log management, notification routing by priority or type.

### 4. Topic Pattern (Event Bus for Microservices)

Topic exchanges use pattern matching for flexible event routing. This is the most popular pattern in microservices architectures.

**Real-world scenario**: You're building an e-commerce platform with events like:
- `order.created`
- `order.paid`
- `order.shipped`
- `order.delivered`
- `order.cancelled`
- `payment.authorized`
- `payment.captured`
- `payment.failed`

Different services care about different subsets of events:

```csharp
channel.ExchangeDeclare("platform-events", ExchangeType.Topic);

// Inventory Service: Cares about all order events
channel.QueueDeclare("inventory-queue", durable: true, false, false);
channel.QueueBind("inventory-queue", "platform-events", "order.*");

// Email Service: Cares about order creation and delivery
channel.QueueDeclare("email-queue", durable: true, false, false);
channel.QueueBind("email-queue", "platform-events", "order.created");
channel.QueueBind("email-queue", "platform-events", "order.delivered");

// Billing Service: Cares about all payment events
channel.QueueDeclare("billing-queue", durable: true, false, false);
channel.QueueBind("billing-queue", "platform-events", "payment.#");

// Analytics: Wants everything
channel.QueueDeclare("analytics-queue", durable: true, false, false);
channel.QueueBind("analytics-queue", "platform-events", "#");

// Publishing events with descriptive routing keys
channel.BasicPublish("platform-events", "order.created", null, orderData);
channel.BasicPublish("platform-events", "payment.authorized", null, paymentData);
```

With this setup:
- `order.created` → Goes to inventory-queue, email-queue, and analytics-queue
- `payment.authorized` → Goes to billing-queue and analytics-queue
- Services can be added or removed without affecting others

**Common use cases**: Microservices event buses, complex routing scenarios, domain event distribution.

### Understanding Consumer Groups and Scaling

A common point of confusion: "If I have multiple consumers subscribed to the same queue, what happens?"

Let's clarify with a concrete example:

**Scenario 1: Competing Consumers (Work Queue)**
```
Producer → [email-queue] → Consumer1 (Server A)
                         → Consumer2 (Server B)
                         → Consumer3 (Server C)
```

All three consumers are connected to the **same queue**. RabbitMQ distributes messages among them:
- Message 1 → Consumer1
- Message 2 → Consumer2
- Message 3 → Consumer3
- Message 4 → Consumer1 (round-robin)

**Each message is processed by only ONE consumer.** This is how you scale horizontally—add more consumers to process more work.

**Scenario 2: Multiple Services (Pub/Sub)**
```
Producer → [Exchange] → Queue1 (Email Service) → Consumer1, Consumer2, Consumer3
                      → Queue2 (Analytics) → Consumer4
                      → Queue3 (Audit) → Consumer5
```

Here, **each service has its own queue**:
- Email Service's three consumers compete for messages in Queue1 (work queue pattern within the service)
- Analytics and Audit services each get their own copy of every message
- All three services process the same event independently

**Critical rule**: Multiple consumers on the same queue = competing. Multiple queues bound to the same exchange/routing key = each queue gets a copy.

**Common use cases**: Work queues for scaling, pub/sub for event distribution, hybrid for scalable microservices (each service scales internally while receiving event copies).

## Reliability Features

In production systems, messages often represent real business value—orders, payments, user data. Losing messages is unacceptable. Let's explore how RabbitMQ ensures reliability.

### Message Acknowledgments: Ensuring Processing

Acknowledgments are RabbitMQ's mechanism for ensuring messages are successfully processed. Without acknowledgments, you have no guarantee that a consumer actually completed its work.

**How it works**:
1. RabbitMQ delivers a message to a consumer
2. The consumer processes the message
3. The consumer explicitly acknowledges success
4. Only then does RabbitMQ remove the message from the queue

If the consumer crashes before acknowledging, RabbitMQ redelivers the message to another consumer. This prevents message loss due to consumer failures.

**Manual Acknowledgment (Recommended for Production):**

```csharp
var consumer = new EventingBasicConsumer(channel);
consumer.Received += (model, ea) =>
{
    var message = Encoding.UTF8.GetString(ea.Body.ToArray());
    
    try
    {
        // Process the message (database write, API call, email send, etc.)
        ProcessPayment(message);
        
        // Explicitly acknowledge success
        // deliveryTag: unique identifier for this message delivery
        // multiple: false means acknowledge only this message
        channel.BasicAck(deliveryTag: ea.DeliveryTag, multiple: false);
        
        Console.WriteLine($"Successfully processed and acknowledged: {message}");
    }
    catch (TemporaryException ex)
    {
        // Temporary failure (database timeout, API unavailable)
        // Reject and requeue for retry
        Console.WriteLine($"Temporary failure, requeueing: {ex.Message}");
        channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: true);
    }
    catch (PermanentException ex)
    {
        // Permanent failure (invalid data, business rule violation)
        // Reject without requeue (will go to DLQ if configured)
        Console.WriteLine($"Permanent failure, sending to DLQ: {ex.Message}");
        channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
    }
};

// autoAck: false means we're handling acknowledgments manually
channel.BasicConsume("payment-queue", autoAck: false, consumer);
```

**Auto-acknowledgment (Risky for Production):**

```csharp
// Message is acknowledged immediately upon delivery
channel.BasicConsume("payment-queue", autoAck: true, consumer);
```

With `autoAck: true`, RabbitMQ considers the message successfully processed as soon as it's delivered. If your consumer crashes mid-processing, the message is lost forever. Only use this for non-critical data or development.

**Acknowledgment strategies**:
- **BasicAck**: Message processed successfully, remove from queue
- **BasicNack with requeue=true**: Temporary failure, retry immediately
- **BasicNack with requeue=false**: Permanent failure, send to dead-letter queue
- **BasicReject**: Similar to BasicNack but for a single message

### Message Durability: Surviving Broker Restarts

Acknowledgments protect against consumer crashes, but what about broker crashes? Durability ensures messages survive RabbitMQ restarts.

**Two components are required**:

**1. Durable Queue Declaration:**
```csharp
// Queue definition survives broker restart
channel.QueueDeclare(
    queue: "payment-queue",
    durable: true,  // Queue persists across restarts
    exclusive: false,
    autoDelete: false
);
```

**2. Persistent Message Publishing:**
```csharp
// Message content survives broker restart
var properties = channel.CreateBasicProperties();
properties.Persistent = true;  // Message is written to disk

var body = Encoding.UTF8.GetBytes("Process payment for order 12345");
channel.BasicPublish("", "payment-queue", properties, body);
```

**Critical**: Both must be configured for full durability. A persistent message in a non-durable queue is lost if the broker restarts (the queue itself disappears). A durable queue with non-persistent messages loses its messages on restart (the queue exists but is empty).

**Performance consideration**: Persistent messages have higher latency because RabbitMQ writes them to disk. For non-critical data (like activity logging), you might skip persistence for better performance. For critical data (orders, payments), always use durability.

**Real-world example**: Your payment processing system:

```csharp
// Durable queue for payment processing
channel.QueueDeclare("payments", durable: true, false, false);

// Every payment message is persistent
var properties = channel.CreateBasicProperties();
properties.Persistent = true;
properties.ContentType = "application/json";

var paymentRequest = new
{
    OrderId = 12345,
    Amount = 99.99,
    Currency = "USD",
    CardToken = "tok_..."
};

var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(paymentRequest));
channel.BasicPublish("", "payments", properties, body);

// If RabbitMQ crashes here and restarts, the message survives
```

### Dead-Letter Queues: Handling Failures Gracefully

Not all messages can be processed successfully. Maybe the data is invalid, an external API is permanently down, or there's a bug in your code. Dead-letter queues (DLQ) provide a safety net for such scenarios.

**How DLQs work**:
1. You configure a normal queue with a "dead-letter exchange" (DLX)
2. When messages fail (rejected, expired, or exceed retry limit), they're routed to the DLX
3. The DLX routes them to a dead-letter queue
4. You can inspect failed messages, fix issues, and optionally reprocess them

**Complete DLQ setup**:

```csharp
// Step 1: Create the dead-letter infrastructure
channel.ExchangeDeclare("dlx-exchange", ExchangeType.Direct, durable: true);
channel.QueueDeclare("dlq-payments", durable: true, false, false);
channel.QueueBind("dlq-payments", "dlx-exchange", "payment-dlq");

// Step 2: Create main queue configured to use the DLX
var args = new Dictionary<string, object>
{
    // When a message is rejected/expires, send it here
    { "x-dead-letter-exchange", "dlx-exchange" },
    { "x-dead-letter-routing-key", "payment-dlq" },
    
    // Optional: Automatic retry with delay
    { "x-message-ttl", 10000 }  // Messages expire after 10 seconds
};

channel.QueueDeclare("payment-queue", durable: true, false, false, args);
```

**Consumer handling failures**:

```csharp
var consumer = new EventingBasicConsumer(channel);
consumer.Received += (model, ea) =>
{
    var message = Encoding.UTF8.GetString(ea.Body.ToArray());
    
    try
    {
        var paymentData = JsonSerializer.Deserialize<PaymentRequest>(message);
        
        // Validate business rules
        if (paymentData.Amount <= 0)
        {
            Console.WriteLine("Invalid amount - sending to DLQ");
            // Permanent failure: don't requeue, goes to DLQ
            channel.BasicNack(ea.DeliveryTag, false, requeue: false);
            return;
        }
        
        ProcessPayment(paymentData);
        channel.BasicAck(ea.DeliveryTag, false);
    }
    catch (PaymentGatewayTimeoutException)
    {
        Console.WriteLine("Payment gateway timeout - requeuing for retry");
        // Temporary failure: requeue for immediate retry
        channel.BasicNack(ea.DeliveryTag, false, requeue: true);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Unexpected error - sending to DLQ: {ex.Message}");
        // Unknown failure: send to DLQ for investigation
        channel.BasicNack(ea.DeliveryTag, false, requeue: false);
    }
};

channel.BasicConsume("payment-queue", autoAck: false, consumer);
```
```csharp
channel.BasicConsume("payment-queue", autoAck: false, consumer);
```

**Messages go to DLQ when**:
1. **Explicitly rejected** with `requeue: false`
2. **TTL expires** (message sat in queue too long)
3. **Queue reaches maximum length** (if configured with `x-max-length`)
4. **Consumer connection drops** before acknowledgment (if configured with consumer timeout)

**Monitoring and handling the DLQ**:

You should have a separate process monitoring the DLQ:

```csharp
// DLQ Consumer for inspection and manual retry
var dlqConsumer = new EventingBasicConsumer(channel);
dlqConsumer.Received += (model, ea) =>
{
    var message = Encoding.UTF8.GetString(ea.Body.ToArray());
    var headers = ea.BasicProperties.Headers;
    
    // RabbitMQ adds metadata about the failure
    if (headers != null)
    {
        // Why did it fail?
        var reason = headers.ContainsKey("x-first-death-reason") 
            ? Encoding.UTF8.GetString((byte[])headers["x-first-death-reason"])
            : "unknown";
            
        // Which queue did it come from?
        var originalQueue = headers.ContainsKey("x-first-death-queue")
            ? Encoding.UTF8.GetString((byte[])headers["x-first-death-queue"])
            : "unknown";
            
        Console.WriteLine($"DLQ Message: {message}");
        Console.WriteLine($"Reason: {reason}, Original Queue: {originalQueue}");
    }
    
    // Log to monitoring system, save to database, or alert on-call engineer
    LogFailedMessage(message, headers);
    
    // Acknowledge to remove from DLQ
    channel.BasicAck(ea.DeliveryTag, false);
};

channel.BasicConsume("dlq-payments", autoAck: false, dlqConsumer);
```

**Production DLQ strategies**:

1. **Alerting**: Set up monitoring to alert when DLQ size exceeds a threshold
2. **Manual review**: Have a dashboard or admin tool to inspect DLQ messages
3. **Automatic retry**: Some teams have a scheduled job that retries DLQ messages (with limits to prevent infinite loops)
4. **Poisonous message handling**: After N failed attempts, move to a "poison message queue" for manual investigation

**Common use cases**: Payment processing failures, invalid data detection, external API outages, business rule violations.

### Quality of Service (QoS) / Prefetch: Fair Work Distribution

By default, RabbitMQ uses round-robin to distribute messages to consumers. But this can create problems.

**The problem**: Imagine you have two workers processing video transcoding:
- Worker 1 receives a 5-second video (processes in 10 seconds)
- Worker 2 receives a 2-hour video (processes in 4 hours)

With basic round-robin, Worker 1 finishes and sits idle while Worker 2 is still working. Meanwhile, more messages pile up in the queue. This is inefficient.

**The solution: QoS / Prefetch**

```csharp
// Only send one unacknowledged message at a time to each consumer
channel.BasicQos(
    prefetchSize: 0,      // 0 = no limit on message size
    prefetchCount: 1,     // Maximum 1 unacknowledged message
    global: false         // Apply per-consumer, not per-channel
);
```

Now the flow is:
1. RabbitMQ sends message 1 to Worker 1
2. RabbitMQ sends message 2 to Worker 2
3. Worker 1 finishes quickly and acknowledges → RabbitMQ immediately sends message 3
4. Worker 2 is still processing → doesn't receive message 4 until it acknowledges message 2
5. Worker 1 processes message 3, acknowledges, receives message 4

This ensures work is distributed based on **actual capacity**, not just round-robin.

**Tuning prefetchCount for different workloads**:

```csharp
// Heavy workload (video processing, PDF generation, ML inference)
channel.BasicQos(0, 1, false);  // One at a time

// Medium workload (API calls, database queries, email sending)
channel.BasicQos(0, 10, false);  // 10 at a time for better throughput

// Lightweight workload (logging, simple calculations, caching)
channel.BasicQos(0, 100, false);  // Many at once for maximum throughput
```

**Real-world example**: Email sending service

```csharp
// Email worker can handle multiple sends concurrently
channel.BasicQos(0, 20, false);  // Process up to 20 emails concurrently

var consumer = new EventingBasicConsumer(channel);
var semaphore = new SemaphoreSlim(20);  // Limit concurrent processing

consumer.Received += async (model, ea) =>
{
    await semaphore.WaitAsync();
    
    try
    {
        var emailData = JsonSerializer.Deserialize<Email>(ea.Body.ToArray());
        await SendEmailAsync(emailData);
        channel.BasicAck(ea.DeliveryTag, false);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Failed to send email: {ex.Message}");
        channel.BasicNack(ea.DeliveryTag, false, requeue: true);
    }
    finally
    {
        semaphore.Release();
    }
};
```

**Key benefits**:
- **Better resource utilization**: Fast workers stay busy, slow workers aren't overwhelmed
- **Predictable performance**: No single worker gets stuck with all the hard jobs
- **Easier scaling**: Add workers and they automatically share the load fairly

### Publisher Confirms: Guaranteeing Message Delivery

So far we've focused on consumer reliability, but what about producers? How does a producer know RabbitMQ actually received and stored the message?

**The problem**: Without confirmations, this can happen:

```csharp
channel.BasicPublish("", "payment-queue", properties, messageBody);
// If RabbitMQ crashes here, did the message make it?
// Network failure? Disk full? You don't know.
SaveOrderToDatabase(orderId, status: "payment-queued");
```

If the publish failed silently, you've marked the order as queued but it never actually reached the queue. The payment never processes.

**The solution: Publisher Confirms**

```csharp
// Enable publisher confirms on this channel
channel.ConfirmSelect();

var message = "Process payment for order 12345";
var body = Encoding.UTF8.GetBytes(message);
var properties = channel.CreateBasicProperties();
properties.Persistent = true;

// Publish the message
channel.BasicPublish("", "payment-queue", properties, body);

// Wait for confirmation
if (channel.WaitForConfirms())
{
    Console.WriteLine("Message confirmed - safely stored in RabbitMQ");
    SaveOrderToDatabase(orderId, status: "payment-queued");
}
else
{
    Console.WriteLine("Message not confirmed - implement retry logic");
    // Retry publishing or log error for manual intervention
}
```

**How it works**:
1. You enable confirms with `ConfirmSelect()`
2. You publish messages as normal
3. RabbitMQ writes the message to disk (if persistent) and to all queue replicas (if quorum queue)
4. RabbitMQ sends back a confirmation
5. Your code waits for confirmation before proceeding

**Handling confirms asynchronously** (for high throughput):

```csharp
channel.ConfirmSelect();

var outstandingConfirms = new ConcurrentDictionary<ulong, string>();

// Handle positive confirmations
channel.BasicAcks += (sender, ea) =>
{
    if (ea.Multiple)
    {
        // Confirm all up to this delivery tag
        var confirmed = outstandingConfirms.Where(k => k.Key <= ea.DeliveryTag);
        foreach (var entry in confirmed)
        {
            outstandingConfirms.TryRemove(entry.Key, out _);
            Console.WriteLine($"Confirmed: {entry.Value}");
        }
    }
    else
    {
        outstandingConfirms.TryRemove(ea.DeliveryTag, out var message);
        Console.WriteLine($"Confirmed: {message}");
    }
};

// Handle negative confirmations (rare, but possible)
channel.BasicNacks += (sender, ea) =>
{
    outstandingConfirms.TryRemove(ea.DeliveryTag, out var message);
    Console.WriteLine($"FAILED to confirm: {message}");
    // Implement retry logic
};

// Publish with tracking
for (int i = 0; i < 1000; i++)
{
    var message = $"Message {i}";
    var body = Encoding.UTF8.GetBytes(message);
    
    var deliveryTag = channel.NextPublishSeqNo;
    outstandingConfirms.TryAdd(deliveryTag, message);
    
    channel.BasicPublish("", "task-queue", null, body);
}

// Wait for all confirms
channel.WaitForConfirmsOrDie();
Console.WriteLine("All messages confirmed");
```

**When to use publisher confirms**:
- **Always** for critical data (payments, orders, user registration)
- For systems where message loss would cause business problems
- In combination with database transactions for consistency

**Performance consideration**: Confirms add latency (typically 1-5ms per message). For high-throughput scenarios, use asynchronous confirms to maintain throughput while still guaranteeing delivery.

## High Availability & Clustering

Single-node RabbitMQ is fine for development, but production systems need resilience. What happens when your RabbitMQ server crashes? Clustering provides the answer.

### Understanding Clusters

A RabbitMQ cluster is multiple nodes (broker instances) working together as a single logical broker. Benefits include:

**Load distribution**: Producers and consumers can connect to different nodes, spreading the load
**Fault tolerance**: If one node fails, others continue serving traffic
**No single point of failure**: Properly configured clusters survive node failures without downtime

**What's shared in a cluster**:
- **Metadata**: Queue and exchange definitions, bindings, virtual hosts, users
- **Routing logic**: All nodes know how to route messages to the correct queues

**What's not automatically shared**:
- **Queue contents**: Classic queues live on one node (though they can be mirrored)
- With quorum queues, message contents ARE replicated

### Connecting to a Cluster

Your application should connect to multiple nodes for resilience:

```csharp
var factory = new ConnectionFactory()
{
    UserName = "user",
    Password = "password",
    AutomaticRecoveryEnabled = true,  // Reconnect on connection loss
    NetworkRecoveryInterval = TimeSpan.FromSeconds(10)
};

// Provide multiple cluster endpoints
var endpoints = new List<AmqpTcpEndpoint>
{
    new AmqpTcpEndpoint("rabbitmq-node1.company.com", 5672),
    new AmqpTcpEndpoint("rabbitmq-node2.company.com", 5672),
    new AmqpTcpEndpoint("rabbitmq-node3.company.com", 5672)
};

// Client library will try each endpoint until one succeeds
using var connection = factory.CreateConnection(endpoints);
using var channel = connection.CreateModel();

Console.WriteLine($"Connected to: {connection.Endpoint}");
```

If the node you're connected to fails, the client library automatically reconnects to another node.

**Load balancer approach** (recommended for production):

Instead of hardcoding node addresses, use a load balancer:

```csharp
var factory = new ConnectionFactory()
{
    HostName = "rabbitmq.company.com",  // Load balancer address
    Port = 5672,
    UserName = "user",
    Password = "password",
    AutomaticRecoveryEnabled = true
};

using var connection = factory.CreateConnection();
```

The load balancer (HAProxy, Nginx, AWS NLB, etc.) distributes connections across healthy nodes and removes failed nodes from rotation.

### Quorum Queues: Modern High Availability

Quorum queues are RabbitMQ's recommended solution for high-availability message storage. They use the Raft consensus algorithm to replicate messages across multiple nodes.

**Key characteristics**:
- **Automatic replication**: Messages are copied to multiple nodes
- **Strong consistency**: All replicas stay synchronized
- **Fault tolerance**: Survives (N-1)/2 node failures in an N-node cluster
- **Performance**: Slight overhead compared to classic queues, but worth it for reliability

**Declaring a quorum queue**:

```csharp
var args = new Dictionary<string, object>
{
    { "x-queue-type", "quorum" }
};

channel.QueueDeclare(
    queue: "payment-queue",
    durable: true,      // Must be true for quorum queues
    exclusive: false,   // Must be false for quorum queues
    autoDelete: false,  // Must be false for quorum queues
    arguments: args
);
```

**How it works internally**:

```
Node 1 (Leader)  ←→  Node 2 (Follower)  ←→  Node 3 (Follower)
    |                      |                     |
[Payment Queue]      [Replica]             [Replica]
```

1. Producer publishes message to any node
2. That node forwards to the queue leader
3. Leader replicates to followers
4. Once majority confirms (2 out of 3), message is committed
5. Leader sends publisher confirm back to producer
6. Consumer can receive from any node (routing happens internally)

**Quorum queue failure scenarios**:

**Scenario 1: One node fails**
```
Node 1 (Leader) ←→ Node 2 (Follower) ←→ Node 3 (FAILED)
```
- Cluster remains operational (2 of 3 nodes = majority)
- Messages continue to be processed
- When Node 3 recovers, it syncs from the leader

**Scenario 2: Leader fails**
```
Node 1 (FAILED) ←→ Node 2 (New Leader) ←→ Node 3 (Follower)
```
- Remaining nodes elect a new leader (typically takes 1-2 seconds)
- Brief disruption while election occurs
- Processing resumes with new leader
- No messages lost (all were replicated)

**Scenario 3: Two nodes fail** (in a 3-node cluster)
```
Node 1 (FAILED) ←→ Node 2 (FAILED) ←→ Node 3 (Alone)
```
- Queue becomes unavailable (no majority)
- Cannot accept new messages or deliver existing ones
- Prevents split-brain scenarios
- When majority restored, queue becomes available again

### Production Cluster Best Practices

**Minimum 3 nodes**: Quorum requires majority, so you need at least 3 nodes to tolerate 1 failure. With 5 nodes, you can tolerate 2 failures.

**Odd number of nodes**: Use 3, 5, or 7 nodes. Even numbers (4, 6) don't provide better fault tolerance than the next lower odd number.

**Geographical distribution**: For disaster recovery, place nodes in different availability zones or data centers. Be aware of network latency impact.

**Monitoring**: Track cluster health, node status, and queue replication lag. Set up alerts for node failures.

**Resource planning**: Quorum queues use more network bandwidth and disk I/O due to replication. Plan capacity accordingly.

**Example production setup**:

```csharp
// Production-ready connection with retry logic
var factory = new ConnectionFactory()
{
    HostName = "rabbitmq-lb.company.com",
    Port = 5672,
    VirtualHost = "/production",
    UserName = Environment.GetEnvironmentVariable("RABBITMQ_USER"),
    Password = Environment.GetEnvironmentVariable("RABBITMQ_PASSWORD"),
    
    // Connection recovery
    AutomaticRecoveryEnabled = true,
    NetworkRecoveryInterval = TimeSpan.FromSeconds(10),
    
    // Heartbeat to detect dead connections
    RequestedHeartbeat = TimeSpan.FromSeconds(60),
    
    // Connection timeout
    RequestedConnectionTimeout = TimeSpan.FromSeconds(30)
};

IConnection connection = null;
var retryCount = 0;
var maxRetries = 5;

while (connection == null && retryCount < maxRetries)
{
    try
    {
        connection = factory.CreateConnection("PaymentService");
        Console.WriteLine("Connected to RabbitMQ cluster");
    }
    catch (Exception ex)
    {
        retryCount++;
        Console.WriteLine($"Connection attempt {retryCount} failed: {ex.Message}");
        
        if (retryCount < maxRetries)
        {
            Thread.Sleep(TimeSpan.FromSeconds(Math.Pow(2, retryCount))); // Exponential backoff
        }
        else
        {
            throw;
        }
    }
}

using (connection)
using (var channel = connection.CreateModel())
{
    // Declare quorum queue with all reliability features
    var args = new Dictionary<string, object>
    {
        { "x-queue-type", "quorum" },
        { "x-dead-letter-exchange", "dlx-exchange" }
    };
    
    channel.QueueDeclare("payment-queue", durable: true, false, false, args);
    channel.BasicQos(0, 10, false);
    channel.ConfirmSelect();
    
    // Your application logic here
}
```

## Monitoring & Management

A well-designed RabbitMQ system is only half the battle. You need visibility into what's happening in production.

### RabbitMQ Management UI

RabbitMQ includes a web-based management interface accessible at `http://localhost:15672` (default credentials: guest/guest in development).

**Key sections**:

**Overview tab**: Cluster-wide statistics
- Message rates (publish/deliver/ack per second)
- Total queued messages across all queues
- Node health and memory usage

**Connections tab**: Active client connections
- Which applications are connected
- Their throughput and channel count
- Connection state (running, blocked, flow)

**Channels tab**: Open channels
- Message rates per channel
- Consumers per channel
- Prefetch settings

**Exchanges tab**: All declared exchanges
- Exchange type and bindings
- Message flow through exchanges

**Queues tab** (most important): All queues and their status
- **Ready**: Messages waiting for consumers
- **Unacked**: Messages delivered but not yet acknowledged
- **Total**: Ready + Unacked
- Consumer count and utilization
- Message rates

**Nodes tab**: Cluster node health
- Memory usage and disk space
- File descriptors and socket usage
- Erlang process count

### Critical Metrics to Monitor

**Queue Length**: The number of ready messages in a queue

```
payment-queue: 15,234 ready messages
```

**What it means**: Consumers can't keep up with producers. Messages are piling up.

**Actions**:
- Scale up consumers (add more worker instances)
- Investigate if consumers are slow (bugs, external API timeouts)
- Check if consumers are even running

**Unacknowledged Messages**: Messages delivered but not acknowledged

```
email-queue: 1,250 unacknowledged messages
```

**What it means**: Consumers are processing slowly, or there's a bug preventing acknowledgment.

**Actions**:
- Check consumer logs for errors
- Verify consumers aren't stuck in infinite loops
- Review prefetch count (might be too high)

**Consumer Count**: Number of active consumers

```
critical-queue: 0 consumers
```

**What it means**: No one is processing messages! This is a production incident.

**Actions**:
- Check if consumer applications are running
- Review deployment logs
- Verify network connectivity between consumers and RabbitMQ

**Message Rates**: Publish vs. deliver throughput

```
Publish rate: 1,000 msg/sec
Deliver rate: 500 msg/sec
```

**What it means**: Messages arriving faster than they're being processed. Queue will grow indefinitely.

**Actions**:
- Scale consumers immediately
- Implement rate limiting on producers if appropriate
- Consider if this is expected (traffic spike) or anomalous

**Connection/Channel Count**: Number of active connections

```
Sudden drop from 50 connections to 10
```

**What it means**: Applications lost connection to RabbitMQ (network issue, deployment, crash).

**Actions**:
- Check application health
- Review RabbitMQ logs for connection errors
- Verify network stability

### Setting Up Alerts

Production systems should alert on-call engineers before problems become disasters:

```yaml
# Example Prometheus alert rules
groups:
  - name: rabbitmq_alerts
    rules:
      - alert: RabbitMQQueueBacklog
        expr: rabbitmq_queue_messages{queue="payment-queue"} > 10000
        for: 5m
        annotations:
          summary: "Payment queue has {{ $value }} messages"
          
      - alert: RabbitMQNoConsumers
        expr: rabbitmq_queue_consumers{queue="payment-queue"} == 0
        for: 1m
        annotations:
          summary: "Payment queue has no consumers"
          
      - alert: RabbitMQNodeDown
        expr: up{job="rabbitmq"} == 0
        for: 1m
        annotations:
          summary: "RabbitMQ node {{ $labels.instance }} is down"
          
      - alert: RabbitMQHighMemoryUsage
        expr: rabbitmq_node_mem_used / rabbitmq_node_mem_limit > 0.9
        for: 5m
        annotations:
          summary: "RabbitMQ memory usage above 90%"
```

### REST API for Automation

You can query RabbitMQ programmatically for dashboards or automated responses:

```bash
# Get queue status
curl -u admin:password http://localhost:15672/api/queues/%2f/payment-queue

# Response:
{
  "name": "payment-queue",
  "messages": 15234,
  "messages_ready": 15100,
  "messages_unacknowledged": 134,
  "consumers": 5,
  "consumer_utilisation": 0.87,
  "message_stats": {
    "publish_details": { "rate": 250.4 },
    "deliver_details": { "rate": 180.2 }
  }
}
```

**Automated scaling example** (pseudo-code):

```csharp
var queueStats = await GetQueueStatsAsync("payment-queue");

if (queueStats.MessagesReady > 10000 && queueStats.Consumers < 20)
{
    // Queue is backed up, scale up consumers
    await KubernetesClient.ScaleDeploymentAsync("payment-worker", replicas: 15);
    await SendAlertAsync("Scaled payment workers to 15 due to queue backlog");
}
else if (queueStats.MessagesReady < 100 && queueStats.Consumers > 3)
{
    // Queue is nearly empty, scale down to save resources
    await KubernetesClient.ScaleDeploymentAsync("payment-worker", replicas: 3);
}
```

## Production Best Practices

Let's bring everything together with a complete production setup that incorporates all reliability features.

### Complete Producer Example

```csharp
using RabbitMQ.Client;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

public class ResilientRabbitMQProducer : IDisposable
{
    private readonly IConnection _connection;
    private readonly IModel _channel;
    private readonly string _exchangeName;
    
    public ResilientRabbitMQProducer(string exchangeName)
    {
        _exchangeName = exchangeName;
        
        // Production-ready connection
        var factory = new ConnectionFactory()
        {
            HostName = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "localhost",
            Port = int.Parse(Environment.GetEnvironmentVariable("RABBITMQ_PORT") ?? "5672"),
            UserName = Environment.GetEnvironmentVariable("RABBITMQ_USER"),
            Password = Environment.GetEnvironmentVariable("RABBITMQ_PASSWORD"),
            VirtualHost = "/production",
            
            // Automatic recovery from connection failures
            AutomaticRecoveryEnabled = true,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(10),
            
            // Detect dead connections
            RequestedHeartbeat = TimeSpan.FromSeconds(60),
            
            // Connection timeout
            RequestedConnectionTimeout = TimeSpan.FromSeconds(30)
        };
        
        _connection = factory.CreateConnection("OrderService");
        _channel = _connection.CreateModel();
        
        // Declare exchange
        _channel.ExchangeDeclare(_exchangeName, ExchangeType.Topic, durable: true);
        
        // Enable publisher confirms
        _channel.ConfirmSelect();
    }
    
    public bool PublishMessage<T>(string routingKey, T message, int maxRetries = 3)
    {
        var attempt = 0;
        
        while (attempt < maxRetries)
        {
            try
            {
                var json = JsonSerializer.Serialize(message);
                var body = Encoding.UTF8.GetBytes(json);
                
                // Create persistent message properties
                var properties = _channel.CreateBasicProperties();
                properties.Persistent = true;
                properties.ContentType = "application/json";
                properties.Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds());
                properties.MessageId = Guid.NewGuid().ToString();
                
                // Publish message
                _channel.BasicPublish(
                    exchange: _exchangeName,
                    routingKey: routingKey,
                    basicProperties: properties,
                    body: body
                );
                
                // Wait for confirmation
                if (_channel.WaitForConfirms(TimeSpan.FromSeconds(5)))
                {
                    Console.WriteLine($"Message published successfully: {routingKey}");
                    return true;
                }
                else
                {
                    Console.WriteLine($"Message not confirmed: {routingKey}");
                    attempt++;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Publish attempt {attempt + 1} failed: {ex.Message}");
                attempt++;
                
                if (attempt < maxRetries)
                {
                    Thread.Sleep(TimeSpan.FromSeconds(Math.Pow(2, attempt))); // Exponential backoff
                }
            }
        }
        
        Console.WriteLine($"Failed to publish after {maxRetries} attempts");
        return false;
    }
    
    public void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
    }
}

// Usage
using (var producer = new ResilientRabbitMQProducer("order-events"))
{
    var order = new
    {
        OrderId = 12345,
        CustomerId = 67890,
        Amount = 199.99,
        Items = new[] { "Product A", "Product B" }
    };
    
    if (producer.PublishMessage("order.created", order))
    {
        // Save to database or proceed with workflow
        SaveOrderToDatabase(order);
    }
    else
    {
        // Handle failure - alert, log, retry later
        LogCriticalError("Failed to publish order message", order);
    }
}
```

### Complete Consumer Example

```csharp
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System;
using System.Text;
using System.Text.Json;
using System.Threading;

public class ResilientRabbitMQConsumer
{
    private readonly IConnection _connection;
    private readonly IModel _channel;
    private readonly string _queueName;
    
    public ResilientRabbitMQConsumer(string queueName, string exchangeName, string routingKey)
    {
        _queueName = queueName;
        
        // Production connection setup
        var factory = new ConnectionFactory()
        {
            HostName = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "localhost",
            Port = int.Parse(Environment.GetEnvironmentVariable("RABBITMQ_PORT") ?? "5672"),
            UserName = Environment.GetEnvironmentVariable("RABBITMQ_USER"),
            Password = Environment.GetEnvironmentVariable("RABBITMQ_PASSWORD"),
            VirtualHost = "/production",
            AutomaticRecoveryEnabled = true,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(10),
            RequestedHeartbeat = TimeSpan.FromSeconds(60)
        };
        
        _connection = factory.CreateConnection("PaymentWorker");
        _channel = _connection.CreateModel();
        
        // Declare infrastructure with DLQ
        DeclareInfrastructure(exchangeName, routingKey);
        
        // Fair dispatch
        _channel.BasicQos(prefetchSize: 0, prefetchCount: 10, global: false);
    }
    
    private void DeclareInfrastructure(string exchangeName, string routingKey)
    {
        // Declare main exchange
        _channel.ExchangeDeclare(exchangeName, ExchangeType.Topic, durable: true);
        
        // Declare DLX infrastructure
        _channel.ExchangeDeclare("dlx-exchange", ExchangeType.Direct, durable: true);
        _channel.QueueDeclare($"dlq-{_queueName}", durable: true, false, false);
        _channel.QueueBind($"dlq-{_queueName}", "dlx-exchange", _queueName);
        
        // Declare main queue with DLX and quorum
        var args = new Dictionary<string, object>
        {
            { "x-queue-type", "quorum" },
            { "x-dead-letter-exchange", "dlx-exchange" },
            { "x-dead-letter-routing-key", _queueName }
        };
        
        _channel.QueueDeclare(_queueName, durable: true, false, false, args);
        _channel.QueueBind(_queueName, exchangeName, routingKey);
    }
    
    public void StartConsuming(Func<string, bool> messageHandler)
    {
        var consumer = new EventingBasicConsumer(_channel);
        
        consumer.Received += (model, ea) =>
        {
            var message = Encoding.UTF8.GetString(ea.Body.ToArray());
            var deliveryTag = ea.DeliveryTag;
            
            try
            {
                Console.WriteLine($"Processing message: {message}");
                
                // Process the message
                var success = messageHandler(message);
                
                if (success)
                {
                    // Acknowledge successful processing
                    _channel.BasicAck(deliveryTag, multiple: false);
                    Console.WriteLine("Message processed and acknowledged");
                }
                else
                {
                    // Business logic failure - send to DLQ
                    Console.WriteLine("Business logic failure - sending to DLQ");
                    _channel.BasicNack(deliveryTag, multiple: false, requeue: false);
                }
            }
            catch (TransientException ex)
            {
                // Temporary failure - requeue for retry
                Console.WriteLine($"Transient error - requeueing: {ex.Message}");
                _channel.BasicNack(deliveryTag, multiple: false, requeue: true);
            }
            catch (Exception ex)
            {
                // Unexpected failure - send to DLQ
                Console.WriteLine($"Unexpected error - sending to DLQ: {ex.Message}");
                _channel.BasicNack(deliveryTag, multiple: false, requeue: false);
            }
        };
        
        _channel.BasicConsume(
            queue: _queueName,
            autoAck: false,
            consumer: consumer
        );
        
        Console.WriteLine($"Consumer started on queue: {_queueName}");
    }
    
    public void Stop()
    {
        _channel?.Close();
        _connection?.Close();
    }
}

// Usage
var consumer = new ResilientRabbitMQConsumer(
    queueName: "payment-queue",
    exchangeName: "order-events",
    routingKey: "order.created"
);

consumer.StartConsuming(message =>
{
    try
    { 
        var order = JsonSerializer.Deserialize<Order>(message);
        ProcessPayment(order);
        return true; // Success
    }
    catch (InvalidDataException)
    {
        // Invalid message format - don't retry
        LogError("Invalid message format", message);
        return false; // Send to DLQ
    }
    catch (PaymentGatewayException ex) when (ex.IsTransient)
    {
        // Gateway timeout - will be retried
        throw new TransientException("Payment gateway timeout", ex);
    }
});

// Keep consumer running
Console.WriteLine("Press [enter] to stop consumer");
Console.ReadLine();
consumer.Stop();

```

### Essential Configuration Checklist

Before deploying to production, ensure you've configured:

✅ **Durable queues** - Survive broker restarts
✅ **Persistent messages** - Message content survives restarts
✅ **Manual acknowledgments** - Prevent message loss on consumer failures
✅ **Publisher confirms** - Guarantee message delivery
✅ **Dead-letter queues** - Handle failures gracefully
✅ **QoS/Prefetch** - Fair work distribution
✅ **Quorum queues** - High availability in clusters
✅ **Automatic recovery** - Reconnect on connection loss
✅ **Monitoring and alerts** - Know when things go wrong
✅ **Proper error handling** - Distinguish transient from permanent failures

### Common Production Patterns

**Pattern 1: Background Job Processing**

```csharp
// API Controller publishes job
[HttpPost("api/reports")]
public IActionResult GenerateReport(ReportRequest request)
{
    using var producer = new ResilientRabbitMQProducer("jobs");
    
    var job = new
    {
        JobId = Guid.NewGuid(),
        Type = "report",
        UserId = request.UserId,
        Parameters = request.Parameters
    };
    
    if (producer.PublishMessage("job.report.generate", job))
    {
        return Accepted(new { JobId = job.JobId, Status = "queued" });
    }
    
    return StatusCode(500, "Failed to queue job");
}

// Background worker processes job
public class ReportWorker
{
    public void Start()
    {
        var consumer = new ResilientRabbitMQConsumer(
            "report-jobs",
            "jobs",
            "job.report.*"
        );
        
        consumer.StartConsuming(message =>
        {
            var job = JsonSerializer.Deserialize<ReportJob>(message);
            
            // Long-running report generation
            var reportData = GenerateReport(job.Parameters);
            SaveReport(job.JobId, reportData);
            NotifyUser(job.UserId, job.JobId);
            
            return true;
        });
    }
}
```

**Pattern 2: Event-Driven Microservices**

```csharp
// Order Service publishes domain events
public class OrderService
{
    private readonly ResilientRabbitMQProducer _producer;
    
    public OrderService()
    {
        _producer = new ResilientRabbitMQProducer("domain-events");
    }
    
    public async Task CreateOrder(OrderRequest request)
    {
        // 1. Save to database
        var order = await _repository.CreateOrderAsync(request);
        
        // 2. Publish event
        var orderCreatedEvent = new
        {
            EventId = Guid.NewGuid(),
            EventType = "OrderCreated",
            Timestamp = DateTime.UtcNow,
            OrderId = order.Id,
            CustomerId = order.CustomerId,
            Items = order.Items,
            TotalAmount = order.Total
        };
        
        _producer.PublishMessage("order.created", orderCreatedEvent);
    }
}

// Inventory Service reacts to order events
public class InventoryService
{
    public void Start()
    {
        var consumer = new ResilientRabbitMQConsumer(
            "inventory-order-events",
            "domain-events",
            "order.created"
        );
        
        consumer.StartConsuming(message =>
        {
            var orderEvent = JsonSerializer.Deserialize<OrderCreatedEvent>(message);
            
            // Reserve inventory for order
            foreach (var item in orderEvent.Items)
            {
                ReserveStock(item.ProductId, item.Quantity);
            }
            
            return true;
        });
    }
}

// Email Service reacts to the same events
public class EmailService
{
    public void Start()
    {
        var consumer = new ResilientRabbitMQConsumer(
            "email-order-events",
            "domain-events",
            "order.created"
        );
        
        consumer.StartConsuming(message =>
        {
            var orderEvent = JsonSerializer.Deserialize<OrderCreatedEvent>(message);
            SendOrderConfirmationEmail(orderEvent.CustomerId, orderEvent.OrderId);
            return true;
        });
    }
}
```

Each service gets its own copy of the event and processes it independently. If Email Service is down, Inventory Service continues working.

**Pattern 3: Request-Reply (RPC)**

Sometimes you need synchronous communication. RabbitMQ supports RPC patterns:

```csharp
// Client sends request and waits for response
public class UserServiceClient
{
    private readonly IModel _channel;
    private readonly string _replyQueueName;
    private readonly ConcurrentDictionary<string, TaskCompletionSource<string>> _callbackMapper;
    
    public UserServiceClient()
    {
        var factory = new ConnectionFactory() { HostName = "localhost" };
        var connection = factory.CreateConnection();
        _channel = connection.CreateModel();
        
        // Declare a temporary queue for replies
        _replyQueueName = _channel.QueueDeclare().QueueName;
        _callbackMapper = new ConcurrentDictionary<string, TaskCompletionSource<string>>();
        
        // Start consuming replies
        var consumer = new EventingBasicConsumer(_channel);
        consumer.Received += (model, ea) =>
        {
            if (_callbackMapper.TryRemove(ea.BasicProperties.CorrelationId, out var tcs))
            {
                var response = Encoding.UTF8.GetString(ea.Body.ToArray());
                tcs.TrySetResult(response);
            }
        };
        
        _channel.BasicConsume(_replyQueueName, autoAck: true, consumer);
    }
    
    public async Task<UserProfile> GetUserAsync(int userId)
    {
        var correlationId = Guid.NewGuid().ToString();
        var tcs = new TaskCompletionSource<string>();
        _callbackMapper[correlationId] = tcs;
        
        var properties = _channel.CreateBasicProperties();
        properties.CorrelationId = correlationId;
        properties.ReplyTo = _replyQueueName;
        
        var request = JsonSerializer.Serialize(new { UserId = userId });
        var body = Encoding.UTF8.GetBytes(request);
        
        _channel.BasicPublish("", "user-rpc-queue", properties, body);
        
        // Wait for response with timeout
        var responseTask = tcs.Task;
        if (await Task.WhenAny(responseTask, Task.Delay(5000)) == responseTask)
        {
            return JsonSerializer.Deserialize<UserProfile>(await responseTask);
        }
        else
        {
            _callbackMapper.TryRemove(correlationId, out _);
            throw new TimeoutException("RPC request timed out");
        }
    }
}

// Server processes RPC requests
public class UserServiceRpcServer
{
    public void Start()
    {
        var factory = new ConnectionFactory() { HostName = "localhost" };
        using var connection = factory.CreateConnection();
        using var channel = connection.CreateModel();
        
        channel.QueueDeclare("user-rpc-queue", durable: false, false, false);
        channel.BasicQos(0, 1, false);
        
        var consumer = new EventingBasicConsumer(channel);
        consumer.Received += (model, ea) =>
        {
            var request = Encoding.UTF8.GetString(ea.Body.ToArray());
            var userRequest = JsonSerializer.Deserialize<UserRequest>(request);
            
            // Fetch user from database
            var user = GetUserFromDatabase(userRequest.UserId);
            var response = JsonSerializer.Serialize(user);
            
            // Send response back
            var replyProps = channel.CreateBasicProperties();
            replyProps.CorrelationId = ea.BasicProperties.CorrelationId;
            
            channel.BasicPublish(
                exchange: "",
                routingKey: ea.BasicProperties.ReplyTo,
                basicProperties: replyProps,
                body: Encoding.UTF8.GetBytes(response)
            );
            
            channel.BasicAck(ea.DeliveryTag, false);
        };
        
        channel.BasicConsume("user-rpc-queue", false, consumer);
        Console.WriteLine("RPC server started");
        Console.ReadLine();
    }
}
```

**Important**: RPC patterns introduce coupling and can reduce scalability. Use them sparingly—asynchronous patterns are usually better for microservices.

### Performance Optimization Tips

**1. Batch Publishing**

For high-throughput scenarios, batch messages:

```csharp
public void PublishBatch(List<Message> messages)
{
    var batch = _channel.CreateBasicPublishBatch();
    
    foreach (var message in messages)
    {
        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message));
        var properties = _channel.CreateBasicProperties();
        properties.Persistent = true;
        
        batch.Add("exchange", "routing.key", false, properties, body);
    }
    
    batch.Publish();
    _channel.WaitForConfirmsOrDie();
}
```

**2. Connection Pooling**

Don't create connections per request—reuse them:

```csharp
public class RabbitMQConnectionPool
{
    private static readonly Lazy<IConnection> _connection = new Lazy<IConnection>(() =>
    {
        var factory = new ConnectionFactory() { HostName = "localhost" };
        return factory.CreateConnection();
    });
    
    public static IConnection GetConnection() => _connection.Value;
}

// Usage
using var channel = RabbitMQConnectionPool.GetConnection().CreateModel();
```

**3. Increase Prefetch for Fast Consumers**

If your consumer processes messages quickly:

```csharp
// Process 50 messages concurrently for better throughput
channel.BasicQos(0, 50, false);
```

**4. Use Lazy Queues for Large Backlogs**

If queues might grow very large, use lazy queues (messages stored on disk):

```csharp
var args = new Dictionary<string, object>
{
    { "x-queue-mode", "lazy" }
};

channel.QueueDeclare("large-queue", durable: true, false, false, args);
```

**5. Tune Network Buffer Sizes**

For high-throughput applications:

```csharp
var factory = new ConnectionFactory()
{
    HostName = "localhost",
    RequestedChannelMax = 2047,  // More channels per connection
    RequestedFrameMax = 131072   // Larger frame size (128KB)
};
```

### Troubleshooting Common Issues

**Issue 1: Messages Piling Up**

**Symptoms**: Queue length growing continuously

**Diagnosis**:
```bash
# Check queue status
rabbitmqctl list_queues name messages consumers

# Check consumer performance
rabbitmqctl list_consumers
```

**Solutions**:
- Scale up consumers (add more worker instances)
- Increase prefetch count if consumers are fast
- Check consumer logs for errors or slow external dependencies
- Review message processing time—optimize slow code paths

**Issue 2: Consumers Not Receiving Messages**

**Symptoms**: Messages in queue but consumers idle

**Diagnosis**:
- Check if consumers are actually connected: `rabbitmqctl list_consumers`
- Verify queue bindings: Check Management UI → Queues → your queue → Bindings
- Check consumer code for errors or exceptions

**Solutions**:
- Restart consumer applications
- Verify network connectivity between consumers and RabbitMQ
- Check for unacknowledged messages blocking delivery (if prefetch is exhausted)
- Review consumer logs for exceptions during message handling

**Issue 3: Messages Lost After Processing**

**Symptoms**: Consumer processes message but it disappears (no errors logged)

**Diagnosis**:
- Check if `autoAck: true` (messages acknowledged before processing)
- Review consumer code for try-catch blocks swallowing exceptions

**Solutions**:
- Always use `autoAck: false` and manual acknowledgments
- Implement proper error handling with logging
- Configure dead-letter queues to capture failed messages

**Issue 4: Connection Failures**

**Symptoms**: Applications can't connect to RabbitMQ

**Diagnosis**:
```bash
# Check RabbitMQ is running
systemctl status rabbitmq-server

# Check logs
tail -f /var/log/rabbitmq/rabbit@hostname.log

# Check connections
rabbitmqctl list_connections
```

**Solutions**:
- Verify RabbitMQ is running
- Check firewall rules (port 5672 for AMQP, 15672 for management)
- Review credentials (username/password)
- Check network connectivity between application and RabbitMQ
- Enable automatic recovery in connection factory

**Issue 5: High Memory Usage**

**Symptoms**: RabbitMQ using excessive memory

**Diagnosis**:
```bash
# Check memory usage per queue
rabbitmqctl list_queues name memory

# Check overall status
rabbitmqctl status
```

**Solutions**:
- Reduce queue backlogs (scale consumers)
- Use lazy queues for large queues
- Increase RabbitMQ memory limit in config
- Consider message TTL to auto-expire old messages
- Review message sizes—compress large messages

## Advanced Topics

### Message Priority Queues

For scenarios where some messages are more urgent:

```csharp
// Declare priority queue (0-255, higher = more urgent)
var args = new Dictionary<string, object>
{
    { "x-max-priority", 10 }
};

channel.QueueDeclare("priority-queue", durable: true, false, false, args);

// Publish with priority
var properties = _channel.CreateBasicProperties();
properties.Priority = 5;  // Medium priority

channel.BasicPublish("", "priority-queue", properties, messageBody);
```

High-priority messages are delivered before lower-priority ones, even if the lower-priority messages arrived first.

**Use case**: Support tickets (critical > high > normal > low), order processing (VIP customers first).

### Message TTL (Time-To-Live)

Automatically expire messages that aren't processed within a timeframe:

```csharp
// Per-queue TTL
var args = new Dictionary<string, object>
{
    { "x-message-ttl", 60000 }  // 60 seconds
};

channel.QueueDeclare("expiring-queue", durable: true, false, false, args);

// Per-message TTL
var properties = channel.CreateBasicProperties();
properties.Expiration = "30000";  // 30 seconds (as string)

channel.BasicPublish("", "expiring-queue", properties, messageBody);
```

Expired messages are removed or routed to a dead-letter exchange if configured.

**Use case**: Time-sensitive notifications (price alerts, flash sales), cache invalidation messages.

### Delayed Messages (Using Plugins)

For scheduled message delivery, use the RabbitMQ delayed message plugin:

```csharp
// Declare delayed exchange (requires rabbitmq_delayed_message_exchange plugin)
var args = new Dictionary<string, object>
{
    { "x-delayed-type", "direct" }
};

channel.ExchangeDeclare("delayed-exchange", "x-delayed-message", durable: true, false, args);

// Publish with delay
var properties = channel.CreateBasicProperties();
properties.Headers = new Dictionary<string, object>
{
    { "x-delay", 30000 }  // Delay 30 seconds
};

channel.BasicPublish("delayed-exchange", "routing-key", properties, messageBody);
```

**Use case**: Retry with exponential backoff, scheduled tasks, reminder notifications.

### Alternate Exchanges

Handle messages that can't be routed:

```csharp
// Create alternate exchange
channel.ExchangeDeclare("unrouted-exchange", ExchangeType.Fanout);
channel.QueueDeclare("unrouted-messages", durable: true, false, false);
channel.QueueBind("unrouted-messages", "unrouted-exchange", "");

// Main exchange with alternate
var args = new Dictionary<string, object>
{
    { "alternate-exchange", "unrouted-exchange" }
};

channel.ExchangeDeclare("main-exchange", ExchangeType.Direct, durable: true, false, args);
```

Messages that don't match any binding go to the alternate exchange instead of being discarded.

**Use case**: Audit all messages, catch routing mistakes, debugging.

## Conclusion

RabbitMQ is a powerful tool for building resilient, scalable distributed systems. The key concepts to remember:

**Core Architecture**:
- Messages always flow through exchanges to queues
- Exchanges route, queues store, consumers process
- Bindings define routing rules

**Exchange Types**:
- **Direct**: Exact routing key matching
- **Fanout**: Broadcast to all queues
- **Topic**: Pattern-based routing
- **Headers**: Metadata-based routing

**Reliability Features**:
- **Manual acknowledgments**: Prevent message loss on consumer failures
- **Durability**: Survive broker restarts (queue + message persistence)
- **Dead-letter queues**: Handle failures gracefully
- **Publisher confirms**: Guarantee message delivery
- **QoS/Prefetch**: Fair work distribution

**Scaling Patterns**:
- **Work queues**: Horizontal scaling with competing consumers
- **Pub/Sub**: Event broadcasting to multiple services
- **Topic routing**: Flexible event-driven architectures

**High Availability**:
- **Quorum queues**: Replicated across cluster nodes
- **Cluster**: Multiple nodes for fault tolerance
- **Monitoring**: Track metrics, set up alerts

**Production Readiness**:
- Always use durable queues and persistent messages for critical data
- Implement comprehensive error handling (transient vs permanent failures)
- Configure dead-letter queues for all critical queues
- Monitor queue lengths, consumer counts, and message rates
- Use quorum queues in clustered production environments

Start with simple patterns (work queues, pub/sub) and add complexity as needed. Focus on reliability first, then optimize for performance. With proper configuration, RabbitMQ provides a robust foundation for asynchronous messaging in microservices architectures.
---

**Credit**: This post was cleaned up and organized from my rough notes with help from LLM — but the thought process, steps, and structure reflect how I personally reason RabbitMQ.


