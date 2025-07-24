# Apache Kafka - Concepts

Apache kafa has been very popular recently for data streaming and many uses it for queueing and messaging platform also in asynchronus platform. 

Example, imagine an IOT system - Internet of Thing - many construction vehciles working in the construction zone for a company. We want to track the movement of every vehicle, gps, their actions, tire pressure and other for safety reason and finally visualize them at the end, log them, notify if there is any risk that going to  happen and so on. It is lot of data as each vechile will be sending lot of data in small iterval of time, say 10 sec, for many types. The answer is apache kafka stream. you can other alternaitve too fo rexample.... 

Apache Cluster and Broker

---

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

---

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