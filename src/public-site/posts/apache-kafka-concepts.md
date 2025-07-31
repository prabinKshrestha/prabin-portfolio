# Apache Kafka - Concepts

Apache kafa has been very popular recently for data streaming and many uses it for queueing and messaging platform also in asynchronus platform. 

Example, imagine an IOT system - Internet of Thing - many construction vehciles working in the construction zone for a company. We want to track the movement of every vehicle, gps, their actions, tire pressure and other for safety reason and finally visualize them at the end, log them, notify if there is any risk that going to  happen and so on. It is lot of data as each vechile will be sending lot of data in small iterval of time, say 10 sec, for many types. The answer is apache kafka stream. you can other alternaitve too fo rexample.... 

## Apache Cluster and Broker

- Apache cluster is a group of brokers
- Broker is a Kafka Server
- usually broker should have 3 in number, but big cluster can huge number of broker (server)
- Kafka Broker Discover
    - Every broker is called a bootstrap server, because when Kafka client connects to any server of the cluster, it is smart enough to get access to all the server. Kafka is designed liked that
    - each broker knows about all brokers, tpics and partitions (metadata)
- Brokers are given ids, such as 100, 101, 102.
- Data are spread across the multiple brokers i.e. Partitions within the Topic are spread accross the brokers. As a result, Kafka cluster acts a horizontal scaling server. For example, if Topic A has parition 01, 02 and 03 and Topic B has partition 01 and 02, then it can spread across the 3 brokers like
    - Broker 100: Topic A 01, Topic B 01
    - Broker 101: Topic A 02, Topic B 02
    - Broker 102: Topic A 03


## Topics, Partition and Offset

### Topics

- Topics are like a table in database. However, it cannot be queried and has not schema or constraint.
- Topics has a name. For example gps_trackings, tire_pressure, and so on
- Data is immutable - data can neither be deleted nor updated. We just stream the data - producer push the data and consumer consume the data
- Any message type are accepted

### Partition

- Topics can have as many partitions as required - Partition 0, 1, 2, 3, 4, ........
- When producer sends message to the topic, the data can be assigned or stored in any random partition unless managed by keys

### Offset

- Within each partition, data are stored in order, called offset
- Offset is incremental i.e. 0, 1, 2, 3, 4, 5....... So, within partion N, offset can be 0, 1, 2, 3, 4, .... m in increasing order and it can go m+1, m+2, .....
- Data persist for certain configuration times and gets deleted - default time is 1 week
- You cannot change the offset even if data is auto deleted, it just keeps on increasing 
- Order is guaranteed within the partition. Data across the partitions does not gurantee the order. 

### Topic Replication
- it is suggested to have topic replication greater than 1, basically 2 or 3
- even if one broker breaks down, other broker can still serve the data
- replication happens at partition level
- one main is called leader while other are called in-sync replicas (ISR)
- producer only connects to the leader partition
- consumer connects to leader by default but after 2.4 version of Kafka, consumer can configured to connect to the closest replica which improves latency
- if broker 100, 101, and 103, and there is a Topic A. A-P01, A-P02 are two partitions of the topic. If replication is 2, then it can replicate the data like following, where l is leader and r is replica:
    - Broker 100 => A-P01 (l) 
    - Broker 101 => A-P01 (r), A-P02 (l)
    - Broker 102 => A-P02 (r)
- In above example, if Broker 101 is dead, then 100 and 102 can still server the data for partition 1 and 2. Remember that data is at partition level

**Durability**
- if replication factor is 3, then kafka can withstand 2 server loss
- so for N factor, N-1 server loss

## Producers

**Overview**
- producer writes data to the topics in the Kafka Broker
- producer knows which Partition to write
- partitions spreads across the Kafka Broker which is a server, and thus send data acts as the load balancer
- **Key** is sent along with the message. If it is null, partition is selected in round robin order i.e. Partition 0, then Partition 1,  then Partition 2, ... and so on.  If key exists, then it will always select the same partition with the help of hashing
- Key is generally passed if order is required. For example, if truck_id is passed as key, it will always select the same Partition and thus message will be always ordered because of incremental nature of the offset within the partition
- key and values should be sent as the bytes to Kafka and consumer should also receive the message in bytes. Producer should serialize the data using Serializer and deserialize in the consumer end.

**Anatomy**
- Key - binary - nullable
- Value - binary - nullable
- compression type
- headers - key value pair
- partition and offset
- timestamp - user or system set

**Hashing**
- **Producer Partioner Logic** takes the record and applies the logic to assign the partition
- hashing is simply converting key to the partition 
- by default murmur2 algorithm is used

**Acknowledgement**
- Has three possible options
    - ack=0
        - do not wait for leader acknowledgement
        - possible data loss
    - ack=1
        - waits for leader acknowledgement
        - limited data loss
    - ack=all
        - waits for leader and all replicas acknowledgement
        - no data loss


## Consumers

- they receive the message from the Kafka topic recognized by Topic
    - follows pull model i.e. Kafka does not push, rather Consumer pull the message
- one consumer can pull from the multiple partition or single partition
- consumer knows which broker to select and if the broker fails it knows recovery like producer
- data are read from offset from small offset value to bigger - incremental pattern

**Consumer Deserializer** 
- Deserialize the binary - byte - formatted key and value in the message to the formatted data. 
- But, it is important to know that message serializer cannot be changed otherwise consumer will not know it. If serialization has to be changed, new message should be sent.

**Consumer Group**
- consumer pulls the data in a group
- consumers within a consumer group, each assigned to different exclusive partition i.e P0, P1 to C1, P2 to C2 and P3, P4 to C3. 
- consumer can be inactive i.e. if some is not assigned to consumer
- consumers in different consumer group can be assigned to the same topic and partition
    - say truck_id gps message are streaming via Kafka. Consumers in one group would send sms while other would log the data
    - should use consumer property group.id 

**Consumer Offset**
- Kakfa stores the offsets at which a consumer group has been reading
- Kafka consumer once in a while should commit the offset to the Kafka, so that Kafka stores the offset of the partition in it's internal Topic called `--consumer-offsets`. Note: Consumer does not write to the topic, but the Kafka itself does. Consumer just have to commit.
- It is important because it helps the reading of data from the committed offset onward
- When consumer dies, it will be able to read back from where it left off because of the committed consumer offsets
- What are the different ways to commit? Delivery Semantics:
    1. At least once
        - After message is processed, offset is commited
        - if Kafka restarts, then there is a chance that consumer would receive the same message again. That is why, in this semantic, consumer should be idempotent i.e. should handle the message duplication, for example checking if notification has been sent
    2. At most once
        - As soon as the message is received, the offset is committed
        - change to loose the data when process fails
    3. Exactly once
        - Kafa -> Kafka Workflows: Transaction API
        - Kafka -> External System Wrokflows: use an indemptent consumer