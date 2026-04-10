'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, getDocs, query, orderBy, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, Briefcase, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';

const MOCK_JOBS = [
  {
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA (Remote)',
    description: 'We are looking for an experienced Frontend Developer with deep knowledge of React, Next.js, and TypeScript. You will be leading the development of our core product dashboard.',
    requirements: JSON.stringify(['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'GraphQL', '5+ years experience']),
    salary: '$130,000 - $160,000',
  },
  {
    title: 'Full Stack Engineer',
    company: 'StartupX',
    location: 'New York, NY',
    description: 'Join our fast-growing startup as a Full Stack Engineer. You will work across the entire stack using Node.js, React, and PostgreSQL.',
    requirements: JSON.stringify(['Node.js', 'React', 'PostgreSQL', 'AWS', 'API Design']),
    salary: '$120,000 - $150,000',
  },
  {
    title: 'Data Scientist',
    company: 'AI Solutions',
    location: 'Remote',
    description: 'Looking for a Data Scientist to help build our next generation of machine learning models. Experience with NLP and LLMs is a huge plus.',
    requirements: JSON.stringify(['Python', 'PyTorch', 'NLP', 'Machine Learning', 'SQL']),
    salary: '$140,000 - $180,000',
  },
  {
    title: 'Product Designer',
    company: 'DesignStudio',
    location: 'Austin, TX',
    description: 'We need a creative Product Designer who can take complex problems and turn them into beautiful, intuitive interfaces.',
    requirements: JSON.stringify(['Figma', 'UI/UX', 'Prototyping', 'User Research', 'Design Systems']),
    salary: '$110,000 - $140,000',
  }
];

function JobsContent() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('resumeId');
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobsQuery = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
        const jobsSnap = await getDocs(jobsQuery);
        
        if (jobsSnap.empty && isAdmin) {
          // Seed mock jobs if admin and empty
          for (const job of MOCK_JOBS) {
            await addDoc(collection(db, 'jobs'), {
              ...job,
              createdAt: new Date().toISOString()
            });
          }
          // Fetch again
          const newSnap = await getDocs(jobsQuery);
          setJobs(newSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
          setJobs(jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'jobs');
      } finally {
        setFetching(false);
      }
    };

    fetchJobs();
  }, [isAdmin]);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || fetching) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Find Jobs</h1>
          <p className="text-muted-foreground">
            {resumeId ? 'Matching jobs for your resume' : 'Browse available positions'}
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search jobs or companies..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map((job) => {
          const reqs = job.requirements ? JSON.parse(job.requirements) : [];
          return (
            <Card key={job.id} className="flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-1">{job.title}</CardTitle>
                    <CardDescription className="text-base text-foreground font-medium">{job.company}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 shrink-0" /> {job.location || 'Not specified'}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4 shrink-0" /> {job.salary || 'Not specified'}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {reqs.slice(0, 3).map((req: string, i: number) => (
                    <Badge key={i} variant="secondary" className="font-normal">{req}</Badge>
                  ))}
                  {reqs.length > 3 && (
                    <Badge variant="outline" className="font-normal">+{reqs.length - 3} more</Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t">
                <Link 
                  href={`/jobs/${job.id}${resumeId ? `?resumeId=${resumeId}` : ''}`}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground [a]:hover:bg-primary/80 h-8 gap-1.5 px-2.5 w-full"
                >
                  {resumeId ? 'Analyze Match' : 'View Details'}
                </Link>
              </CardFooter>
            </Card>
          );
        })}
        
        {filteredJobs.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No jobs found</h3>
            <p className="text-muted-foreground">Try adjusting your search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-4rem)]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <JobsContent />
    </Suspense>
  );
}
