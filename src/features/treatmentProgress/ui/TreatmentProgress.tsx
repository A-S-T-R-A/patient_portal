"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/shared/ui/toast";
import { CheckCircle, Circle, Clock, Eye } from "lucide-react";

interface TreatmentStep {
  id: string;
  title: string;
  subtitle?: string;
  status: "done" | "current" | "upcoming";
  eta?: string;
}

export function TreatmentProgress() {
  const [steps, setSteps] = useState<TreatmentStep[]>([]);
  const [currentStep, setCurrentStep] = useState<TreatmentStep | null>(null);
  const [progress, setProgress] = useState({
    currentStep: 0,
    totalSteps: 0,
    percent: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  const fetchSteps = useCallback(async () => {
    try {
      const response = await fetch("/api/treatment/steps");
      const data = await response.json();
      setSteps(data);

      const current = data.find(
        (step: TreatmentStep) => step.status === "current"
      );
      setCurrentStep(current);

      const completedCount = data.filter(
        (step: TreatmentStep) => step.status === "done"
      ).length;
      setProgress({
        currentStep: current?.id ? parseInt(current.id) : 0,
        totalSteps: data.length,
        percent: Math.round((completedCount / data.length) * 100),
      });
    } catch {
      addToast({
        title: "Error",
        description: "Failed to load treatment steps",
        type: "error",
      });
    }
  }, [addToast]);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  const handleCompleteStep = async (stepId: string) => {
    try {
      const response = await fetch("/api/treatment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSteps(data.steps);
        setProgress(data.progress);

        const newCurrent = data.steps.find(
          (step: TreatmentStep) => step.status === "current"
        );
        setCurrentStep(newCurrent);

        addToast({
          title: "Step Completed",
          description: "Treatment step marked as done",
          type: "success",
        });
      } else {
        throw new Error("Failed to complete step");
      }
    } catch {
      addToast({
        title: "Error",
        description: "Failed to complete step",
        type: "error",
      });
    }
  };

  const getStepIcon = (status?: string) => {
    switch (status) {
      case "done":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "current":
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  const getStepColor = (status?: string) => {
    switch (status) {
      case "done":
        return "text-green-600";
      case "current":
        return "text-blue-600";
      default:
        return "text-gray-400";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStepIcon(currentStep?.status)}
          You&apos;re on Step {currentStep?.id} of {steps.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress.percent}%</span>
          </div>
          <Progress value={progress.percent} className="h-2" />
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Treatment Progress →
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Treatment Progress</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    step.status === "current"
                      ? "bg-blue-50 border-blue-200"
                      : ""
                  }`}
                >
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <div
                      className={`text-sm font-medium ${getStepColor(
                        step.status
                      )}`}
                    >
                      Step {step.id}: {step.title}
                    </div>
                    <div className="text-xs text-gray-500">{step.subtitle}</div>
                    {step.eta && (
                      <div className="text-xs text-gray-400 mt-1">
                        {step.eta}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {step.status === "done" && (
                      <Badge variant="secondary" className="text-xs">
                        Done
                      </Badge>
                    )}
                    {step.status === "current" && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                    {step.status === "current" && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteStep(step.id)}
                        className="text-xs"
                      >
                        Mark as Done
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
