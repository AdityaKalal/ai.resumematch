'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import * as pdfjsLib from 'pdfjs-dist';
import { GoogleGenAI, Type } from '@google/genai';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export default function UploadResume() {
  const { user } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] // Simplified to PDF for now
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  };

  const analyzeResumeWithAI = async (text: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
    
    const prompt = `You are an expert ATS (Applicant Tracking System) and career coach. Analyze the following resume text and extract structured data and provide an analysis.
    
    Resume Text:
    ${text}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            parsedData: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                experience: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      company: { type: Type.STRING },
                      duration: { type: Type.STRING },
                      description: { type: Type.STRING }
                    }
                  } 
                },
                education: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      degree: { type: Type.STRING },
                      institution: { type: Type.STRING },
                      year: { type: Type.STRING }
                    }
                  }
                }
              }
            },
            aiAnalysis: {
              type: Type.OBJECT,
              properties: {
                atsScore: { type: Type.NUMBER, description: "Score out of 100" },
                skillGap: { type: Type.ARRAY, items: { type: Type.STRING }, description: "General skills missing for typical roles in this field" },
                keywordSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                formattingImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
                summary: { type: Type.STRING, description: "A brief summary of the resume's strengths and weaknesses" }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setError(null);
    setProgress(10);
    setStatus('Extracting text from PDF...');

    try {
      // 1. Extract Text
      const text = await extractTextFromPDF(file);
      setProgress(40);
      setStatus('Analyzing resume with AI...');

      // 2. Analyze with Gemini
      const aiResult = await analyzeResumeWithAI(text);
      setProgress(80);
      setStatus('Saving results...');

      // 3. Save to Firestore
      const resumeData = {
        userId: user.uid,
        fileName: file.name,
        parsedData: JSON.stringify(aiResult.parsedData),
        aiAnalysis: JSON.stringify(aiResult.aiAnalysis),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'resumes'), resumeData);
      setProgress(100);
      setStatus('Complete!');
      
      // Redirect to analysis page
      setTimeout(() => {
        router.push(`/dashboard/resume/${docRef.id}`);
      }, 1000);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An error occurred during processing');
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Upload Resume</h1>
        <p className="text-muted-foreground">Upload your resume for AI analysis and job matching.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          {!uploading ? (
            <div className="space-y-6">
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'}
                  ${file ? 'border-primary/50 bg-primary/5' : ''}
                `}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-background rounded-full shadow-sm border">
                    <UploadCloud className="h-8 w-8 text-primary" />
                  </div>
                  {file ? (
                    <div className="space-y-1">
                      <p className="font-medium text-lg">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-medium text-lg">Drag & drop your resume here</p>
                      <p className="text-sm text-muted-foreground">or click to browse files</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Supports PDF up to 5MB</p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  size="lg" 
                  onClick={handleUpload} 
                  disabled={!file}
                  className="w-full sm:w-auto"
                >
                  Analyze Resume
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="relative">
                {progress === 100 ? (
                  <CheckCircle2 className="h-16 w-16 text-primary" />
                ) : (
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                )}
              </div>
              <div className="space-y-2 w-full max-w-md">
                <h3 className="text-xl font-semibold">{status}</h3>
                <Progress value={progress} className="h-2 w-full" />
                <p className="text-sm text-muted-foreground">{progress}% Complete</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
