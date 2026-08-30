import * as amqplib from 'amqplib';
import dotenv from 'dotenv';
import { QUEUES } from './queues';

dotenv.config();

let connection: amqplib.ChannelModel | null = null;
let channel: amqplib.Channel | null = null;

async function getChannel(): Promise<amqplib.Channel> {
  if (!channel) {
    connection = await amqplib.connect(
      process.env.RABBITMQ_URL || 'amqp://admin:secret@localhost:5672'
    );
    channel = await connection.createChannel();

    // Declare all queues as durable on startup
    for (const q of Object.values(QUEUES)) {
      await channel.assertQueue(q, { durable: true });
    }

    connection.on('error', (err: Error) => {
      console.error('[Queue] Connection error:', err.message);
      channel = null;
      connection = null;
    });

    console.log('[Queue] RabbitMQ connected, queues declared.');
  }
  return channel!;
}

export const queue = {
  /**
   * Publish a JSON message to a queue.
   */
  publish: async (queueName: string, payload: object): Promise<boolean> => {
    const ch = await getChannel();
    return ch.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true, contentType: 'application/json' }
    );
  },

  /**
   * Subscribe to a queue and process messages with auto-ACK/NACK.
   */
  consume: async (
    queueName: string,
    handler: (payload: any) => Promise<void>
  ): Promise<void> => {
    const ch = await getChannel();
    await ch.consume(queueName, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        await handler(payload);
        ch.ack(msg);
      } catch (err) {
        console.error(`[Queue] Error processing message from ${queueName}:`, err);
        ch.nack(msg, false, false); // Dead-letter on failure
      }
    });
  },

  /**
   * Gracefully close the queue connection.
   */
  close: async (): Promise<void> => {
    if (channel) { await channel.close(); channel = null; }
    if (connection) { await connection.close(); connection = null; }
  },

  /**
   * Ping the queue — used for health checks.
   */
  ping: async (): Promise<boolean> => {
    try {
      await getChannel();
      return true;
    } catch {
      return false;
    }
  },
};

export default queue;
