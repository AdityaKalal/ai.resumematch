'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, MapPin, DollarSign, Briefcase, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { GoogleGenAI, Type } from '@google/genai';

function JobDetailsContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const jobId = params.id as string;
  const resumeId = searchParams.get('resumeId');
  
  const [job, setJob] = useState<any>(null);
  const [resume, setResume] = useState<any>(null);
  const [matchResult, setMatchResult] = useState<any>(null);
  
  const [fetching, setFetching] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Job
        const jobRef = doc(db, 'jobs', jobId);
        const jobSnap = await getDoc(jobRef);
        if (jobSnap.exists()) {
          setJob({ id: jobSnap.id, ...jobSnap.data() });
        } else {
          router.push('/jobs');
          return;
        }

        // If user is logged in and resumeId is provided, fetch resume and check for existing match
        if (user && resumeId) {
          const resumeRef = doc(db, 'resumes', resumeId);
          const resumeSnap = await getDoc(resumeRef);
          if (resumeSnap.exists() && resumeSnap.data().userId === user.uid) {
            setResume({ id: resumeSnap.id, ...resumeSnap.data() });
            
            // Check for existing match
            const matchQuery = query(
              collection(db, 'jobMatches'),
              where('userId', '==', user.uid),
              where('resumeId', '==', resumeId),
              where('jobId', '==', jobId)
            );
            const matchSnap = await getDocs(matchQuery);
            if (!matchSnap.empty) {
              setMatchResult({ id: matchSnap.docs[0].id, ...matchSnap.docs[0].data() });
            }
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `jobs/${jobId}`);
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [jobId, resumeId, user, router]);

  const performMatchAnalysis = async () => {
    if (!job || !resume || !user) return;
    
    setAnalyzing(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      const prompt = `You are an expert technical recruiter. Analyze the semantic similarity and fit between the candidate's resume and the job description.
      
      Job Title: ${job.title}
      Company: ${job.company}
      Job Description: ${job.description}
      Job Requirements: ${job.requirements}
      
      Candidate Resume Parsed Data:
      ${resume.parsedData}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchPercentage: { type: Type.NUMBER, description: "Match score from 0 to 100" },
              missingSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Required skills from the job description that are missing in the resume" },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific recommendations on how to improve the resume for this specific job" },
              summary: { type: Type.STRING, description: "A brief summary of why the candidate is or isn't a good fit" }
            }
          }
        }
      });

      const analysis = JSON.parse(response.text || '{}');
      
      const matchData = {
        userId: user.uid,
        resumeId: resume.id,
        jobId: job.id,
        matchPercentage: analysis.matchPercentage || 0,
        missingSkills: JSON.stringify(analysis.missingSkills || []),
        recommendations: JSON.stringify(analysis.recommendations || []),
        summary: analysis.summary || '',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'jobMatches'), matchData);
      setMatchResult({ id: docRef.id, ...matchData });
      
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to analyze match');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading || fetching) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!job) return null;

  const reqs = job.requirements ? JSON.parse(job.requirements) : [];
  const missingSkills = matchResult?.missingSkills ? JSON.parse(matchResult.missingSkills) : [];
  const recommendations = matchResult?.recommendations ? JSON.parse(matchResult.recommendations) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/jobs" className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 h-8 gap-1.5 px-2.5 -ml-4 mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{job.title}</h1>
            <div className="text-xl text-muted-foreground mb-6">{job.company}</div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-8">
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 shrink-0" /> {job.location || 'Not specified'}
              </div>
              <div className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4 shrink-0" /> {job.salary || 'Not specified'}
              </div>
              <div className="flex items-center">
                <Briefcase className="mr-2 h-4 w-4 shrink-0" /> Full-time
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">About the Role</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Requirements</h2>
            <ul className="list-disc pl-5 space-y-2">
              {reqs.map((req: string, i: number) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          {resumeId && resume ? (
            <Card className="border-primary/20 shadow-md sticky top-24">
              <CardHeader>
                <CardTitle>Match Analysis</CardTitle>
                <CardDescription>Comparing {resume.fileName} to this role</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!matchResult ? (
                  <div className="text-center py-6">
                    {analyzing ? (
                      <div className="space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        <p className="text-sm text-muted-foreground">Analyzing semantic fit...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Run an AI analysis to see how well your resume matches this job description.</p>
                        <Button onClick={performMatchAnalysis} className="w-full">
                          Analyze Match
                        </Button>
                        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-8 border-muted">
                        <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                          <circle
                            cx="60"
                            cy="60"
                            r="56"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeDasharray="351.8"
                            strokeDashoffset={351.8 - (351.8 * matchResult.matchPercentage) / 100}
                            className={matchResult.matchPercentage >= 75 ? 'text-green-500' : matchResult.matchPercentage >= 50 ? 'text-yellow-500' : 'text-red-500'}
                          />
                        </svg>
                        <span className={`text-3xl font-bold ${matchResult.matchPercentage >= 75 ? 'text-green-500' : matchResult.matchPercentage >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {matchResult.matchPercentage}%
                        </span>
                      </div>
                      <p className="mt-4 text-center text-sm text-muted-foreground">
                        {matchResult.summary}
                      </p>
                    </div>

                    {missingSkills.length > 0 && (
                      <div>
                        <h4 className="flex items-center font-medium mb-2 text-sm text-destructive">
                          <XCircle className="mr-2 h-4 w-4" /> Missing Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {missingSkills.map((skill: string, i: number) => (
                            <Badge key={i} variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {recommendations.length > 0 && (
                      <div>
                        <h4 className="flex items-center font-medium mb-2 text-sm text-primary">
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Recommendations
                        </h4>
                        <ul className="space-y-2">
                          {recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start">
                              <span className="mr-2 mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Apply for this role</CardTitle>
                <CardDescription>Upload a resume to see your match score</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/upload" className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground [a]:hover:bg-primary/80 h-8 gap-1.5 px-2.5 w-full">
                  Upload Resume
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JobDetails() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-4rem)]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <JobDetailsContent />
    </Suspense>
  );
}
