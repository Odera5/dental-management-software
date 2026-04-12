import React from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import WaitingRoomBoard from "../components/WaitingRoom/WaitingRoomBoard";

export default function WaitingRoom() {
  const location = useLocation();
  const newPatient = location.state?.newPatient || null;
  const preselectPatientId = location.state?.preselectPatientId || "";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-6 md:p-8 h-full overflow-y-auto">
      <WaitingRoomBoard
        newPatient={newPatient}
        preselectPatientId={preselectPatientId}
      />
    </motion.div>
  );
}
