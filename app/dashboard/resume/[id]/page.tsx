'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CheckCircle2, AlertTriangle, Lightbulb, Briefcase, GraduationCap, Search } from 'lucide-react';
import Link from 'next/link';

export default function ResumeAnalysis() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const resumeId = params.id as string;
  
  const [resume, setResume] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchResume = async () => {
      if (!user || !resumeId) return;
      
      try {
        const docRef = doc(db, 'resumes', resumeId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && (docSnap.data().userId === user.uid || user.email === 'adityakalal5053@gmail.com')) {
          setResume({ id: docSnap.id, ...docSnap.data() });
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `resumes/${resumeId}`);
      } finally {
        setFetching(false);
      }
    };

    fetchResume();
  }, [user, resumeId, router]);

  if (loading || fetching) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">Loading...</div>;
  }

  if (!resume) return null;

  const parsedData = resume.parsedData ? JSON.parse(resume.parsedData) : null;
  const aiAnalysis = resume.aiAnalysis ? JSON.parse(resume.aiAnalysis) : null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 h-8 gap-1.5 px-2.5 -ml-4 mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resume Analysis</h1>
            <p className="text-muted-foreground">{resume.fileName}</p>
          </div>
          <Link href={`/jobs?resumeId=${resume.id}`} className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground [a]:hover:bg-primary/80 h-8 gap-1.5 px-2.5">
            <Search className="mr-2 h-4 w-4" /> Find Matching Jobs
          </Link>
        </div>
      </div>

      {aiAnalysis && (
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="md:col-span-1 border-primary/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">ATS Compatibility Score</CardTitle>
              <CardDescription>Based on industry standards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
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
                      strokeDashoffset={351.8 - (351.8 * aiAnalysis.atsScore) / 100}
                      className={getScoreColor(aiAnalysis.atsScore)}
                    />
                  </svg>
                  <span className={`text-4xl font-bold ${getScoreColor(aiAnalysis.atsScore)}`}>
                    {aiAnalysis.atsScore}
                  </span>
                </div>
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {aiAnalysis.summary}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Actionable Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="flex items-center font-medium mb-3 text-sm uppercase tracking-wider text-muted-foreground">
                  <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" /> Skill Gaps
                </h4>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.skillGap?.map((skill: string, i: number) => (
                    <Badge key={i} variant="secondary" className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 border-yellow-500/20">
                      {skill}
                    </Badge>
                  ))}
                  {(!aiAnalysis.skillGap || aiAnalysis.skillGap.length === 0) && (
                    <span className="text-sm text-muted-foreground">No major skill gaps identified.</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="flex items-center font-medium mb-3 text-sm uppercase tracking-wider text-muted-foreground">
                  <Lightbulb className="mr-2 h-4 w-4 text-blue-500" /> Suggested Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.keywordSuggestions?.map((keyword: string, i: number) => (
                    <Badge key={i} variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="flex items-center font-medium mb-3 text-sm uppercase tracking-wider text-muted-foreground">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Formatting Improvements
                </h4>
                <ul className="space-y-2">
                  {aiAnalysis.formattingImprovements?.map((improvement: string, i: number) => (
                    <li key={i} className="text-sm flex items-start">
                      <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {parsedData && (
        <Tabs defaultValue="experience" className="space-y-4">
          <TabsList>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
          </TabsList>
          
          <TabsContent value="experience">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="mr-2 h-5 w-5" /> Work Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {parsedData.experience?.map((exp: any, i: number) => (
                  <div key={i} className="relative pl-6 border-l-2 border-muted pb-6 last:pb-0">
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5" />
                    <h3 className="font-semibold text-lg">{exp.title}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <span className="font-medium text-foreground mr-2">{exp.company}</span>
                      <span>• {exp.duration}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{exp.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle>Extracted Skills</CardTitle>
                <CardDescription>Skills identified from your resume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills?.map((skill: string, i: number) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1 text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="mr-2 h-5 w-5" /> Education
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {parsedData.education?.map((edu: any, i: number) => (
                  <div key={i} className="relative pl-6 border-l-2 border-muted pb-6 last:pb-0">
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5" />
                    <h3 className="font-semibold text-lg">{edu.degree}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span className="font-medium text-foreground mr-2">{edu.institution}</span>
                      <span>• {edu.year}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
