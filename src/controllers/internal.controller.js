import { ApiError } from "../utils/ApiError.js";

export const triggerOptimization = async (req, res) => {
  // In semester 2, this will forward the request to Python OR-Tools service
  res.status(200).json({ message: "Optimization trigger stubbed for Semester 1." });
};
