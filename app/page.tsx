'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { FileText, Target, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const { user, signInWithGoogle } = useAuth();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-background to-muted/20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 mb-4">
            <Zap className="h-3.5 w-3.5 mr-1" /> Powered by Gemini AI
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            Land Your Dream Job with <span className="text-primary">AI-Powered</span> Resume Analysis
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your resume, get instant AI feedback, discover skill gaps, and match with the perfect jobs based on semantic similarity.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {user ? (
              <Link href="/dashboard" className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground [a]:hover:bg-primary/80 h-12 px-8 text-base">
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <Button size="lg" className="h-12 px-8 text-base" onClick={signInWithGoogle}>
                Get Started for Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              View Demo
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Three simple steps to optimize your career path.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-6 bg-card rounded-2xl border shadow-sm"
            >
              <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Upload Resume</h3>
              <p className="text-muted-foreground mb-4">
                Upload your PDF or DOCX resume. Our system extracts your skills, experience, and education automatically.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm"><CheckCircle2 className="h-4 w-4 text-primary mr-2" /> Fast parsing</li>
                <li className="flex items-center text-sm"><CheckCircle2 className="h-4 w-4 text-primary mr-2" /> Secure storage</li>
              </ul>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="p-6 bg-card rounded-2xl border shadow-sm"
            >
              <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. AI Analysis</h3>
              <p className="text-muted-foreground mb-4">
                Get an ATS compatibility score, skill gap analysis, and tailored suggestions to improve your bullet points.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm"><CheckCircle2 className="h-4 w-4 text-primary mr-2" /> ATS Scoring</li>
                <li className="flex items-center text-sm"><CheckCircle2 className="h-4 w-4 text-primary mr-2" /> Actionable feedback</li>
              </ul>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="p-6 bg-card rounded-2xl border shadow-sm"
            >
              <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Job Matching</h3>
              <p className="text-muted-foreground mb-4">
                We match your profile against real job listings using semantic similarity to find the perfect fit.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm"><CheckCircle2 className="h-4 w-4 text-primary mr-2" /> Smart matching</li>
                <li className="flex items-center text-sm"><CheckCircle2 className="h-4 w-4 text-primary mr-2" /> Missing skills highlight</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
