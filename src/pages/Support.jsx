import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, MessageCircle, ArrowLeft, ArrowRight } from "lucide-react";
import Button from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

const supportEmail = "primuxcare@gmail.com";
const whatsappNumber = "08068073362";
const whatsappLink = "https://wa.me/2348068073362";

export default function Support() {
  return (
    <div className="min-h-screen bg-surface-50 font-sans flex flex-col pt-16 md:pt-24 items-center px-4 relative overflow-hidden">
      {/* Abstract Background Accents */}
      <div className="absolute top-0 w-full h-[400px] bg-gradient-to-br from-primary-950 via-primary-900 to-primary-700/90 -skew-y-3 origin-top-left z-0 scale-110 shadow-2xl" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 z-0" />
      <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-indigo-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl z-10 relative space-y-8"
      >
        <div className="text-center">
          <div className="flex bg-white/10 backdrop-blur-md h-24 w-24 mx-auto rounded-3xl items-center justify-center mb-6 shadow-xl border border-white/20 p-1">
            <img
              src="/primuxcare-logo.png"
              alt="PrimuxCare logo"
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            How can we help?
          </h1>
          <p className="mt-4 text-primary-100 text-lg max-w-lg mx-auto">
            PrimuxCare is here to ensure your clinic runs seamlessly. Get in touch with our product support team.
          </p>
        </div>

        <Card className="shadow-2xl border-0 overflow-hidden bg-white/95 backdrop-blur-sm rounded-3xl">
          <div className="p-8 md:p-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Contact Support</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <a 
                href={`mailto:${supportEmail}`}
                className="group flex flex-col p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-primary-50 hover:border-primary-200 transition-all duration-300"
              >
                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 mb-4 group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all duration-300">
                  <Mail size={24} className="text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Email Us</h3>
                <p className="text-primary-600 font-medium group-hover:underline text-sm mb-2">{supportEmail}</p>
                <p className="text-slate-500 text-sm mt-auto">We typically reply within 2 hours.</p>
              </a>

              <a 
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-300"
              >
                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 mb-4 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all duration-300">
                  <MessageCircle size={24} className="text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">WhatsApp Chat</h3>
                <p className="text-emerald-700 font-medium group-hover:underline text-sm mb-2">{whatsappNumber}</p>
                <p className="text-slate-500 text-sm mt-auto">Immediate assistance for urgent issues.</p>
              </a>
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-100 w-full flex flex-col sm:flex-row gap-4 items-center justify-between">
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto text-slate-600 bg-white hover:bg-slate-100 border-slate-200">
                <ArrowLeft size={18} className="mr-2" /> Back to Login
              </Button>
            </Link>
            <Link to="/register-clinic" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                Register Clinic <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
