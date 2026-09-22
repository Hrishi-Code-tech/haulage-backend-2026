from math import radians, sin, cos, asin, sqrt
from typing import Annotated

from fastapi import FastAPI, HTTPException
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
from pydantic import BaseModel, Field

app = FastAPI(title="Haulage Routing Engine", version="1.0.0")


class Coordinate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class LoadRequirements(BaseModel):
    origin: Coordinate
    destination: Coordinate
    weight: float = Field(gt=0)


class OptimizeMatchingRequest(BaseModel):
    load: LoadRequirements
    nearby_drivers: list[Coordinate] = Field(min_length=1, max_length=500)


def haversine_km(first: Coordinate, second: Coordinate) -> float:
    latitude_delta = radians(second.latitude - first.latitude)
    longitude_delta = radians(second.longitude - first.longitude)
    first_latitude = radians(first.latitude)
    second_latitude = radians(second.latitude)
    value = sin(latitude_delta / 2) ** 2 + cos(first_latitude) * cos(second_latitude) * sin(longitude_delta / 2) ** 2
    return 6371.0 * 2 * asin(sqrt(value))


def build_distance_matrix(points: list[Coordinate]) -> list[list[int]]:
    return [
        [round(haversine_km(source, target) * 1000) for target in points]
        for source in points
    ]


def optimize_driver_order(request: OptimizeMatchingRequest) -> list[int]:
    destination = request.load.destination
    points = [request.load.origin, *request.nearby_drivers, destination]
    distance_matrix = build_distance_matrix(points)
    manager = pywrapcp.RoutingIndexManager(len(points), 1, [0], [len(points) - 1])
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index: int, to_index: int) -> int:
        return distance_matrix[manager.IndexToNode(from_index)][manager.IndexToNode(to_index)]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    solution = routing.SolveWithParameters(search_parameters)
    if solution is None:
        raise HTTPException(status_code=422, detail="No feasible driver order found")

    ordered_driver_indexes: list[int] = []
    index = routing.Start(0)
    while not routing.IsEnd(index):
        node = manager.IndexToNode(index)
        if 1 <= node <= len(request.nearby_drivers):
            ordered_driver_indexes.append(node - 1)
        index = solution.Value(routing.NextVar(index))
    return ordered_driver_indexes


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.post("/internal/optimize-matching")
def optimize_matching(request: Annotated[OptimizeMatchingRequest, "load and nearby driver coordinates"]):
    ordered_indexes = optimize_driver_order(request)
    return {
        "matches": [request.nearby_drivers[index].model_dump() for index in ordered_indexes],
        "driver_indexes": ordered_indexes,
    }
