"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ANONYMOUS_OWNER } from "@/lib/constants";

export default function NewRepoForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setStatus("error");
      setMessage("Repository name is required.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to create repository");
      }
      setName("");
      setStatus("idle");
      setMessage("Repository created.");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Failed to create repository");
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="form-header">
        <div>
          <div className="card-title">New repository</div>
          <div className="card-meta">
            Create a bare repo in GIT_PROJECT_ROOT/{ANONYMOUS_OWNER}.
          </div>
        </div>
      </div>
      <label className="field">
        <span>Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="example-repo"
        />
      </label>
      <button className="button" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Creating..." : "Create repository"}
      </button>
      {message ? (
        <p className={status === "error" ? "error" : "muted"}>{message}</p>
      ) : null}
    </form>
  );
}
