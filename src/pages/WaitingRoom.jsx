import React from "react";
import { useNavigate } from "react-router-dom";
import WaitingRoomBoard from "../components/WaitingRoom/WaitingRoomBoard";

export default function WaitingRoom() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="container mx-auto space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Waiting Room</h1>
            <p className="text-gray-600">
              Track arrivals, update queue status, and keep the clinic moving.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 w-full md:w-auto"
          >
            Back to Dashboard
          </button>
        </div>
        <WaitingRoomBoard />
      </div>
    </div>
  );
}
