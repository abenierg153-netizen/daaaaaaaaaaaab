import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Smile<span className="text-blue-600">Flow</span>
        </h1>
        <p className="text-2xl text-gray-600 mb-4">
          Production Admin Dashboard
        </p>
        <p className="text-lg text-gray-500 mb-12">
          Enterprise-grade dental clinic management with async queues, enhanced UI, and performance optimizations
        </p>
        
        <div className="flex gap-4 justify-center mb-16">
          <Link href="/admin">
            <Button size="lg" className="text-lg px-8">
              Admin Dashboard
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-blue-600 text-3xl mb-3">👥</div>
            <h3 className="font-semibold text-lg mb-2">Staff Management</h3>
            <p className="text-gray-600 text-sm">
              Complete staff management with granular permissions, role badges, and real-time updates
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-blue-600 text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-lg mb-2">Enhanced Analytics</h3>
            <p className="text-gray-600 text-sm">
              Real-time dashboard with activity feeds, audit logs, and comprehensive statistics
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-blue-600 text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-lg mb-2">Performance Optimized</h3>
            <p className="text-gray-600 text-sm">
              Async email queues, database indexes, and responsive design for enterprise scale
            </p>
          </div>
        </div>

        <div className="mt-16 text-sm text-gray-500">
          <p>Production-ready admin dashboard with HIPAA compliance</p>
        </div>
      </div>
    </div>
  );
}
