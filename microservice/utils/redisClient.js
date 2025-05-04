import { createClient } from "redis";

const redisClient = createClient();

async function connectRedis() {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');

    } catch (error) {
        console.log('Unable to connect Redis!');
    }
}

connectRedis();

export default redisClient;