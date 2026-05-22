"use client";

import { useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Github,
  Brain,
  Zap,
  Mail,
  Trello,
  Table,
  MessageSquare,
} from "lucide-react";

type NodeKind = "trigger" | "ai" | "automation" | "action";

type WorkflowNodeData = {
  label: string;
  sub: string;
  icon: React.ReactNode;
  kind: NodeKind;
  status?: "active" | "idle";
};

const kindStyle: Record<NodeKind, string> = {
  trigger: "from-cyan-400/15 to-cyan-400/5 border-cyan-400/40",
  ai: "from-brand-500/20 to-brand-500/5 border-brand-400/50",
  automation: "from-amber-400/15 to-amber-400/5 border-amber-400/40",
  action: "from-white/[0.06] to-white/[0.02] border-white/15",
};

function WorkflowNode({ data }: NodeProps<WorkflowNodeData>) {
  return (
    <div
      className={
        "rounded-2xl border bg-gradient-to-br backdrop-blur-xl px-4 py-3 min-w-[200px] shadow-card " +
        kindStyle[data.kind]
      }
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-cyan-400 !border-cyan-400 !w-2 !h-2"
      />
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-navy-900/80 border border-white/10 grid place-items-center text-cyan-300">
          {data.icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-semibold">
            {data.kind}
          </p>
          <p className="text-sm font-semibold text-white truncate">
            {data.label}
          </p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
        {data.sub}
      </p>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-cyan-400 !border-cyan-400 !w-2 !h-2"
      />
    </div>
  );
}

const nodeTypes = { workflow: WorkflowNode };

export function WorkflowFlow() {
  const nodes = useMemo<Node<WorkflowNodeData>[]>(
    () => [
      {
        id: "github",
        type: "workflow",
        position: { x: 0, y: 180 },
        data: {
          label: "GitHub Webhook",
          sub: "Commits, PRs, deployments, incidents",
          icon: <Github className="h-4 w-4" />,
          kind: "trigger",
        },
      },
      {
        id: "groq",
        type: "workflow",
        position: { x: 320, y: 180 },
        data: {
          label: "Groq AI Analysis",
          sub: "Risk scoring · blockers · recommended actions",
          icon: <Brain className="h-4 w-4" />,
          kind: "ai",
        },
      },
      {
        id: "zapier",
        type: "workflow",
        position: { x: 640, y: 180 },
        data: {
          label: "Zapier Orchestrator",
          sub: "Catch hook · fan-out to integrations",
          icon: <Zap className="h-4 w-4" />,
          kind: "automation",
        },
      },
      {
        id: "gmail",
        type: "workflow",
        position: { x: 980, y: 20 },
        data: {
          label: "Gmail Alerts",
          sub: "Notify DevOps & PR reviewers",
          icon: <Mail className="h-4 w-4" />,
          kind: "action",
        },
      },
      {
        id: "trello",
        type: "workflow",
        position: { x: 980, y: 130 },
        data: {
          label: "Trello Cards",
          sub: "QA checklists · incident cards",
          icon: <Trello className="h-4 w-4" />,
          kind: "action",
        },
      },
      {
        id: "sheets",
        type: "workflow",
        position: { x: 980, y: 240 },
        data: {
          label: "Google Sheets",
          sub: "Audit log of every event",
          icon: <Table className="h-4 w-4" />,
          kind: "action",
        },
      },
      {
        id: "discord",
        type: "workflow",
        position: { x: 980, y: 350 },
        data: {
          label: "Discord / Slack",
          sub: "On-call pings · incident channel",
          icon: <MessageSquare className="h-4 w-4" />,
          kind: "action",
        },
      },
    ],
    []
  );

  const edgeStyle = { stroke: "#22d3ee", strokeWidth: 2 };
  const edges = useMemo<Edge[]>(
    () => [
      {
        id: "e1",
        source: "github",
        target: "groq",
        animated: true,
        style: edgeStyle,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#22d3ee" },
      },
      {
        id: "e2",
        source: "groq",
        target: "zapier",
        animated: true,
        style: edgeStyle,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#22d3ee" },
      },
      {
        id: "e3",
        source: "zapier",
        target: "gmail",
        animated: true,
        style: { stroke: "#046bd2", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#046bd2" },
      },
      {
        id: "e4",
        source: "zapier",
        target: "trello",
        animated: true,
        style: { stroke: "#046bd2", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#046bd2" },
      },
      {
        id: "e5",
        source: "zapier",
        target: "sheets",
        animated: true,
        style: { stroke: "#046bd2", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#046bd2" },
      },
      {
        id: "e6",
        source: "zapier",
        target: "discord",
        animated: true,
        style: { stroke: "#046bd2", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#046bd2" },
      },
    ],
    []
  );

  return (
    <div className="glass-card overflow-hidden h-[560px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        zoomOnScroll={false}
        panOnScroll
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1}
          color="rgba(255,255,255,0.05)"
        />
        <Controls
          position="bottom-left"
          showInteractive={false}
          className="!bg-navy-900/80 !border-white/10 !rounded-xl overflow-hidden"
        />
      </ReactFlow>
    </div>
  );
}
