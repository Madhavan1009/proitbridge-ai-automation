"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AutomationRule } from "@/lib/types";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Section } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/Skeleton";
import { RuleForm } from "@/components/rules/RuleForm";
import { RuleList } from "@/components/rules/RuleList";

export default function RulesPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [createBusy, setCreateBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.rules();
      setRules(data.rules);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load rules.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async (rule: AutomationRule) => {
    setCreateBusy(true);
    try {
      await api.createRule(rule);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create rule.");
    } finally {
      setCreateBusy(false);
    }
  };

  const handleToggle = async (rule: AutomationRule) => {
    if (!rule.id) return;
    setBusyId(rule.id);
    try {
      await api.updateRule(rule.id, { ...rule, enabled: !rule.enabled });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to toggle rule.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await api.deleteRule(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete rule.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Section tone="dark" className="!pt-6 !pb-16">
      <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Automation Rules"
        description="Compose conditions that route AI-analyzed events to specific Zapier actions"
      />

      {error && (
        <div className="rounded-2xl border border-risk-high/40 bg-risk-high/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      <RuleForm onCreate={handleCreate} busy={createBusy} />

      <SectionHeader
        title="Active Rules"
        description={`${rules.length} rule${rules.length === 1 ? "" : "s"} configured`}
      />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <RuleList
          rules={rules}
          onToggle={handleToggle}
          onDelete={handleDelete}
          busyId={busyId}
        />
      )}
      </div>
    </Section>
  );
}
