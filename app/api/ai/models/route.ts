import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Try to list available models using the REST API
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey
      );
      
      if (response.ok) {
        const data = await response.json();
        const models = data.models || [];
        const availableModels = models
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace('models/', ''));
        
        return NextResponse.json({
          models: availableModels,
          allModels: models.map((m: any) => ({
            name: m.name.replace('models/', ''),
            displayName: m.displayName,
            supportedMethods: m.supportedGenerationMethods,
          })),
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch models');
      }
    } catch (error: any) {
      // If listing fails, return common model names
      return NextResponse.json({
        models: [
          'gemini-1.5-flash',
          'gemini-1.5-pro',
          'gemini-pro',
        ],
        error: error.message,
        note: 'Using default model list. Check your API key permissions.',
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get models' },
      { status: 500 }
    );
  }
}

