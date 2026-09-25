import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Helper to seed the database with initial dummy data if empty.
 */
async function autoSeedIfEmpty() {
    const existingOrders = await prisma.orderLoad.count();
    if (existingOrders > 0) return;

    console.log('Database is empty. Auto-seeding dummy data...');
    
    // Create a default tenant
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Default Tenant'
        }
    });

    // Create Carriers
    await prisma.carrierDriver.createMany({
        data: [
            {
                tenantId: tenant.id,
                name: 'Alex Johnson',
                phone: '+49 172 123 4567',
                vehicleCapacityKg: 25000,
                languagePreference: 'en',
            },
            {
                tenantId: tenant.id,
                name: 'Maria Schmidt',
                phone: '+49 172 987 6543',
                vehicleCapacityKg: 20000,
                languagePreference: 'de',
            }
        ]
    });

    // Create Orders
    const order1 = await prisma.orderLoad.create({
        data: {
            tenantId: tenant.id,
            origin: 'Rotterdam, NL',
            destination: 'Berlin, DE',
            weightKg: 18000,
            targetRate: 1200,
            status: 'IN_TRANSIT',
        }
    });

    const order2 = await prisma.orderLoad.create({
        data: {
            tenantId: tenant.id,
            origin: 'Hamburg, DE',
            destination: 'Copenhagen, DK',
            weightKg: 22000,
            targetRate: 1500,
            status: 'BOOKED',
        }
    });

    const order3 = await prisma.orderLoad.create({
        data: {
            tenantId: tenant.id,
            origin: 'Paris, FR',
            destination: 'Amsterdam, NL',
            weightKg: 12000,
            targetRate: 900,
            status: 'PENDING',
        }
    });

    // Create telemetry for IN_TRANSIT order
    await prisma.telemetryLog.createMany({
        data: [
            {
                orderId: order1.id,
                latitude: 52.0116,
                longitude: 7.5686,
                timestamp: new Date(Date.now() - 10 * 60 * 1000)
            },
            {
                orderId: order1.id,
                latitude: 51.9194,
                longitude: 7.6521,
                timestamp: new Date()
            }
        ]
    });

    console.log('Dummy data auto-seeded successfully.');
}

/**
 * Get all active orders
 */
export const getOrders = async (req, res) => {
    // Auto-seed on first fetch
    await autoSeedIfEmpty();

    const orders = await prisma.orderLoad.findMany({
        include: {
            telemetryLogs: {
                orderBy: { timestamp: 'desc' },
                take: 1
            },
            invoice: true
        },
        orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(new ApiResponse(200, 'Orders fetched successfully', orders));
};

/**
 * Get a specific order
 */
export const getOrderById = async (req, res) => {
    const { loadId } = req.params;

    const order = await prisma.orderLoad.findUnique({
        where: { id: loadId },
        include: {
            telemetryLogs: {
                orderBy: { timestamp: 'desc' }
            },
            invoice: true
        }
    });

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    res.status(200).json(new ApiResponse(200, 'Order fetched successfully', order));
};

/**
 * Get available carriers
 */
export const getCarriers = async (req, res) => {
    const carriers = await prisma.carrierDriver.findMany();
    res.status(200).json(new ApiResponse(200, 'Carriers fetched successfully', carriers));
};
