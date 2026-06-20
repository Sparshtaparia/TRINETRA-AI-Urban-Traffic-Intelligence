import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Radio, FileSpreadsheet, UploadCloud, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { API_BASE } from "../../lib/api";

export function LiveConfigModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"selection" | "csv_config">("selection");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // CSV State
  const [file, setFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState("");
  const [fileId, setFileId] = useState("");
  const [schemaStatus, setSchemaStatus] = useState<"pending" | "validating" | "ready">("pending");
  const [mapping, setMapping] = useState<any>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setMode("selection");
    setFile(null);
    setFilePath("");
    setFileId("");
    setSchemaStatus("pending");
    setMapping({});
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFilePath(""); // Clear append path
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      setIsProcessing(true);
      setSchemaStatus("validating");
      try {
        const uploadRes = await fetch(API_BASE + "/api/live/upload-csv-source", {
          method: "POST",
          body: formData
        });
        const uploadData = await uploadRes.json();
        
        if (uploadData.status === "uploaded") {
          setFileId(uploadData.file_id);
          
          const valRes = await fetch(API_BASE + "/api/live/validate-csv-source", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_id: uploadData.file_id })
          });
          const valData = await valRes.json();
          if (valData.status === "ready") {
            setMapping(valData.detected_mapping);
            setSchemaStatus("ready");
          }
        }
      } catch (err) {
        console.error(err);
        alert("Failed to upload and validate CSV.");
        setSchemaStatus("pending");
      }
      setIsProcessing(false);
    }
  };

  const startReplay = async () => {
    setIsProcessing(true);
    try {
      // Flatten mapping: backend expects {field: "column_name"} not {field: {column, confidence}}
      const flatMapping: Record<string, string> = {};
      for (const [field, val] of Object.entries(mapping)) {
        if (typeof val === "object" && val !== null && "column" in val) {
          flatMapping[field] = (val as { column: string }).column;
        } else {
          flatMapping[field] = String(val);
        }
      }

      const res = await fetch(API_BASE + "/api/live/start-csv-replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_id: fileId,
          poll_interval: 2,
          events_per_tick: 3,
          mapping: flatMapping
        })
      });
      const data = await res.json();
      if (data.status !== "connected") {
        alert(data.message || "Failed to start replay.");
        setIsProcessing(false);
        return;
      }
      localStorage.setItem("live_source_type", "csv_polling");
      setTimeout(() => {
        router.push("/dashboard/live");
      }, 500);
    } catch (err) {
      console.error(err);
      alert("Failed to start replay.");
    }
    setIsProcessing(false);
  };

  const startAppendPolling = async () => {
    if (!filePath) return;
    setIsProcessing(true);
    try {
      await fetch(API_BASE + "/api/live/start-file-polling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: filePath,
          poll_interval: 3,
          mapping: {}
        })
      });
      localStorage.setItem("live_source_type", "csv_polling");
      setTimeout(() => {
        router.push("/dashboard/live");
      }, 500);
    } catch (err) {
      console.error(err);
      alert("Failed to start polling.");
    }
    setIsProcessing(false);
  };

  const startWebSocketDemo = async () => {
    setIsProcessing(true);
    try {
      await fetch(API_BASE + "/api/live/start-demo-stream", { method: "POST" });
      localStorage.setItem("live_source_type", "websocket");
      setTimeout(() => router.push("/dashboard/live"), 500);
    } catch (err) {
      console.error(err);
      alert("Failed to start WebSocket demo stream.");
    }
    setIsProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-neutral-900 text-white border-neutral-800 sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Real-Time Operations Configuration</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Connect a streaming source to feed live events into the PICQ Intelligence Engine.
          </DialogDescription>
        </DialogHeader>

        {mode === "selection" ? (
          <div className="grid md:grid-cols-2 gap-4 py-6 items-stretch">
            <div 
              className="flex flex-col border border-neutral-800 rounded-lg p-6 hover:bg-neutral-800/50 transition-colors border-[#39FF14]/30 shadow-[0_0_15px_rgba(57,255,20,0.1)] cursor-pointer h-full"
              onClick={() => setMode("csv_config")}
            >
              <FileSpreadsheet className="w-8 h-8 text-[#39FF14] mb-4 flex-shrink-0" />
              <h3 className="font-semibold text-lg mb-2 break-words">Near-Real-Time CSV / Excel Polling</h3>
              <p className="text-sm text-neutral-400 mb-6 flex-grow">
                Upload a snapshot for demo replay, or enter a backend-accessible file path for true append polling.
              </p>
              <div className="text-sm font-medium text-[#39FF14] flex items-center mt-auto">
                Configure Source →
              </div>
            </div>

            <div className="flex flex-col border border-neutral-800 rounded-lg p-6 hover:bg-neutral-800/50 transition-colors opacity-70 h-full">
              <Activity className="w-8 h-8 text-blue-400 mb-4 flex-shrink-0" />
              <h3 className="font-semibold text-lg mb-2 break-words">WebSocket Internal Stream</h3>
              <p className="text-sm text-neutral-400 mb-6 flex-grow">
                Launch an internally generated synthetic event stream over WebSockets.
              </p>
              <Button 
                className="w-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 mt-auto" 
                onClick={startWebSocketDemo}
                disabled={isProcessing}
              >
                {isProcessing ? "Starting..." : "Launch WebSocket Demo"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-6">
            <div className="text-sm text-neutral-400">
              Upload snapshot for demo replay, or enter a backend-accessible file path for true append polling.
            </div>
            
            <div className="p-4 border border-neutral-800 rounded-lg bg-neutral-950 space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  className="bg-neutral-900 border-neutral-700 hover:bg-neutral-800"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <UploadCloud className="w-4 h-4 mr-2" />
                  {file ? "Change File" : "Select File"}
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload} 
                />
                {file && <span className="text-sm text-neutral-300">{file.name}</span>}
              </div>
              
              {schemaStatus === "validating" && <div className="text-sm text-yellow-400 animate-pulse">Validating Live Schema...</div>}
              {schemaStatus === "ready" && (
                <div className="text-sm text-[#39FF14] flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Schema validated and mapped
                </div>
              )}

              {schemaStatus === "ready" && (
                <Button 
                  className="w-full bg-[#39FF14] text-black hover:bg-[#32e011]" 
                  onClick={startReplay}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Starting..." : "Start CSV Replay"}
                </Button>
              )}
            </div>

            <div className="flex items-center justify-center">
              <span className="text-neutral-500 text-sm">OR</span>
            </div>

            <div className="p-4 border border-neutral-800 rounded-lg bg-neutral-950 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-neutral-400">Backend File Path</label>
                <Input 
                  placeholder="e.g. backend/live_sources/parking_events.csv" 
                  className="bg-neutral-900 border-neutral-800"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
                onClick={startAppendPolling}
                disabled={!filePath || isProcessing}
              >
                {isProcessing ? "Starting..." : "Start Append Polling"}
              </Button>
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-800">
              <Button variant="ghost" onClick={() => setMode("selection")}>Back</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
