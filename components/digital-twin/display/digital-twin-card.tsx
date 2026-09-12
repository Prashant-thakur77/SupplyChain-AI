"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, Clock } from 'lucide-react';

interface DigitalTwin {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

interface DigitalTwinCardProps {
  twin: DigitalTwin;
}

export default function DigitalTwinCard({ twin }: DigitalTwinCardProps) {
  const getRiskColor = (tag: string) => {
    if (tag.toLowerCase().includes('high risk')) return 'bg-black text-white dark:bg-white dark:text-black shadow-sm';
    if (tag.toLowerCase().includes('medium risk')) return 'bg-gray-200 text-black dark:bg-gray-800 dark:text-white shadow-sm';
    if (tag.toLowerCase().includes('low risk')) return 'bg-white text-gray-600 border border-gray-200 dark:bg-black dark:text-gray-400 dark:border-gray-800 shadow-sm';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-800 shadow-sm';
  };

  return (
    <Link href={`/digital-twin/view/${twin.id}`} className="block h-full">
      <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-300 h-full dark:bg-slate-950 border shadow-md group relative overflow-visible cursor-pointer">
        {/* Subtle animated gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        
        {/* Floating action indicator */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 z-50">
          <div className="bg-white/90 dark:bg-gray-700/90 rounded-full p-2 shadow-sm">
            <ArrowRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </div>
        </div>
        
        <CardHeader className="relative z-10 pb-3">
          <CardTitle className="text-black dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200 flex items-start justify-between pr-12">
            <span className="line-clamp-2">{twin.name}</span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-200 line-clamp-2">
            {twin.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10 pt-0">
          <div className="flex flex-wrap gap-2">
            {twin.tags.map((tag, index) => {
              const isRiskTag = tag.toLowerCase().includes('risk');
              const tagClass = isRiskTag ? getRiskColor(tag) : 'bg-white text-black border border-gray-200 dark:bg-black dark:text-white dark:border-gray-800 shadow-sm';
              const isDateTag = /\w{3}-\d{4}/.test(tag); // Matches format like "Jun-2024"
              
              return (
                <Badge 
                  key={tag} 
                  className={`${tagClass} transition-all duration-200 border-0 font-medium text-xs px-2 py-1 flex items-center gap-1`}
                >
                  {isDateTag && <Clock className="h-3 w-3" />}
                  {tag}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
} 