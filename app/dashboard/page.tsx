'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus, UploadCloud, Briefcase, BarChart } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch resumes
        const resumesQuery = query(
          collection(db, 'resumes'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const resumesSnap = await getDocs(resumesQuery);
        const resumesData = resumesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setResumes(resumesData);

        // Fetch matches
        const matchesQuery = query(
          collection(db, 'jobMatches'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const matchesSnap = await getDocs(matchesQuery);
        const matchesData = matchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMatches(matchesData);
        
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'resumes/jobMatches');
      } finally {
        setFetching(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading || fetching) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.displayName}</p>
        </div>
        <Link href="/dashboard/upload" className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground [a]:hover:bg-primary/80 h-8 gap-1.5 px-2.5">
          <Plus className="mr-2 h-4 w-4" /> Upload Resume
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Matches</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. ATS Score</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resumes.length > 0 
                ? Math.round(resumes.reduce((acc, r) => {
                    const analysis = r.aiAnalysis ? JSON.parse(r.aiAnalysis) : { atsScore: 0 };
                    return acc + (analysis.atsScore || 0);
                  }, 0) / resumes.length) + '%'
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resumes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumes">My Resumes</TabsTrigger>
          <TabsTrigger value="matches">Job Matches</TabsTrigger>
        </TabsList>
        
        <TabsContent value="resumes" className="space-y-4">
          {resumes.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
              <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No resumes uploaded</h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Upload your first resume to get AI analysis and start matching with jobs.
              </p>
              <Link href="/dashboard/upload" className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground [a]:hover:bg-primary/80 h-8 gap-1.5 px-2.5">Upload Resume</Link>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {resumes.map((resume) => {
                const analysis = resume.aiAnalysis ? JSON.parse(resume.aiAnalysis) : null;
                return (
                  <Card key={resume.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="truncate" title={resume.fileName}>{resume.fileName}</CardTitle>
                      <CardDescription>
                        Uploaded on {format(new Date(resume.createdAt), 'MMM d, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      {analysis ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">ATS Score</span>
                            <span className="font-medium">{analysis.atsScore}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${analysis.atsScore}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Analysis pending...</p>
                      )}
                    </CardContent>
                    <div className="p-6 pt-0 mt-auto">
                      <Link href={`/dashboard/resume/${resume.id}`} className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 h-8 gap-1.5 px-2.5 w-full">View Analysis</Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="matches" className="space-y-4">
          {matches.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
              <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No job matches yet</h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Upload a resume and browse jobs to see your match scores.
              </p>
              <Link href="/jobs" className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 h-8 gap-1.5 px-2.5">Browse Jobs</Link>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {matches.map((match) => (
                <Card key={match.id}>
                  <CardHeader>
                    <CardTitle>Job Match</CardTitle>
                    <CardDescription>
                      Matched on {format(new Date(match.createdAt), 'MMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center p-6">
                      <div className="relative flex items-center justify-center h-24 w-24 rounded-full border-4 border-primary/20">
                        <span className="text-2xl font-bold text-primary">{match.matchPercentage}%</span>
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Link href={`/jobs/${match.jobId}`} className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 h-8 gap-1.5 px-2.5 w-full">View Job</Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
