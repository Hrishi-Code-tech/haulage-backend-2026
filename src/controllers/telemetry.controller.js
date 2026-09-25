import prisma from "../config/db.js";
import {z} from 'zod'
import {redisPublisher} from '../utils/websocket.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
const telemetrySchema = z.object({
    load_id: z.string().uuid(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timestamp: z.string().datetime().optional()
})

export const ingestTelemetry = async (req , res )=>
{
    try {
        const parsed = telemetrySchema.safeParse(req.body);
        if (!parsed.success) {
            throw new ApiError(400, "Invalid telemetry data", parsed.error.issues);
        }
        const { load_id, latitude, longitude, timestamp } = parsed.data;

        const logTime = timestamp ? new Date(timestamp) : new Date();

        const channel = `telemetry:${load_id}`;
        const payload = JSON.stringify({ load_id, latitude, longitude, timestamp: logTime.toISOString() });
                if (redisPublisher.status === 'ready') {
                    await redisPublisher.publish(channel, payload);
                }
        
                await prisma.telemetryLog.create({
      data: {
                orderId: load_id,
        latitude,
        longitude,
        timestamp: logTime
      }
    });
        res.status(200).json(new ApiResponse(200, "Telemetry data ingested successfully", { load_id, latitude, longitude, timestamp: logTime.toISOString() }));
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, "Error ingesting telemetry data", [error.message]);
    }
}

export const getTelemetryHistory = async (req, res) => {
    const { loadId } = req.params;
    const history = await prisma.telemetryLog.findMany({
        where: { orderId: loadId },
        orderBy: { timestamp: 'desc' }
    });
    res.status(200).json(new ApiResponse(200, 'Telemetry history fetched', history));
};
