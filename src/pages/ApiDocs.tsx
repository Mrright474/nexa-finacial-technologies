import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Check, Globe, Lock, Zap, Shield, BookOpen, Terminal, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nxa-web3-api`;

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-lg bg-[hsl(var(--muted))] border border-border overflow-hidden">
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className="p-4 text-xs leading-relaxed overflow-x-auto text-foreground/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  POST: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

interface Endpoint {
  method: string;
  path: string;
  title: string;
  description: string;
  auth: boolean;
  permissions?: string[];
  params?: { name: string; type: string; required: boolean; description: string }[];
  bodyParams?: { name: string; type: string; required: boolean; description: string }[];
  curl: string;
  response: string;
}

const endpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/health",
    title: "Health Check",
    description: "Verify the API is running. Returns version and timestamp.",
    auth: false,
    curl: `curl -s "${BASE_URL}/health"`,
    response: `{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-04-16T12:00:00.000Z"
}`,
  },
  {
    method: "GET",
    path: "/price",
    title: "NXA Price",
    description: "Get the latest NXA token price and computed tokenomics metrics.",
    auth: false,
    curl: `curl -s "${BASE_URL}/price"`,
    response: `{
  "price": 0.1842,
  "price_updated_at": "2026-04-16T11:55:00.000Z",
  "metrics": {
    "total_supply": 950000000,
    "circulating_supply": 420000000,
    "total_staked": 85000000,
    "total_burned": 12500000,
    "demand_score": 72.5,
    "supply_pressure": 0.34
  }
}`,
  },
  {
    method: "GET",
    path: "/supply",
    title: "Token Supply",
    description: "Detailed breakdown of NXA supply, staking, collateral, and burn totals.",
    auth: false,
    curl: `curl -s "${BASE_URL}/supply"`,
    response: `{
  "max_supply": 1000000000,
  "total_supply": 950000000,
  "circulating_supply": 420000000,
  "total_staked": 85000000,
  "total_collateral": 15000000,
  "total_burned": 12500000,
  "demand_score": 72.5,
  "supply_pressure": 0.34
}`,
  },
  {
    method: "GET",
    path: "/leaderboard",
    title: "Burn Leaderboard",
    description: "Top NXA burn contributors ranked by total amount burned.",
    auth: false,
    params: [
      { name: "limit", type: "number", required: false, description: "Number of results (1-100, default 20)" },
    ],
    curl: `curl -s "${BASE_URL}/leaderboard?limit=5"`,
    response: `{
  "leaderboard": [
    {
      "user_id": "abc-123",
      "first_name": "Alice",
      "last_name": "N.",
      "avatar_url": null,
      "total_burned": 54200.50,
      "burn_count": 128
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/balance",
    title: "NXA Balance",
    description: "Get the authenticated user's NXA wallet balance.",
    auth: true,
    permissions: ["read"],
    curl: `curl -s "${BASE_URL}/balance" \\
  -H "X-API-Key: nxa_your_api_key_here"`,
    response: `{
  "balance": 15420.75,
  "updated_at": "2026-04-16T10:30:00.000Z"
}`,
  },
  {
    method: "GET",
    path: "/burns",
    title: "Burn History",
    description: "Get the authenticated user's NXA burn event history.",
    auth: true,
    permissions: ["read"],
    params: [
      { name: "limit", type: "number", required: false, description: "Number of results (1-100, default 50)" },
    ],
    curl: `curl -s "${BASE_URL}/burns?limit=10" \\
  -H "X-API-Key: nxa_your_api_key_here"`,
    response: `{
  "burns": [
    {
      "id": "burn-uuid",
      "amount": 5.25,
      "source": "web3_swap_fee",
      "created_at": "2026-04-16T09:00:00.000Z",
      "transaction_id": "tx-uuid"
    }
  ]
}`,
  },
  {
    method: "POST",
    path: "/trade",
    title: "Execute Trade",
    description: "Record an external trade. The platform automatically calculates a fee and burns a percentage of it according to the current burn rate.",
    auth: true,
    permissions: ["trade"],
    bodyParams: [
      { name: "amount", type: "number", required: true, description: "Trade amount (positive number)" },
      { name: "type", type: "string", required: false, description: '"swap" (default, 0.5% fee) or "trade" (0.1% fee)' },
      { name: "from_currency", type: "string", required: false, description: 'Source currency (default "NXA")' },
      { name: "to_currency", type: "string", required: false, description: 'Target currency (default "USD")' },
    ],
    curl: `curl -s -X POST "${BASE_URL}/trade" \\
  -H "X-API-Key: nxa_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 1000,
    "type": "swap",
    "from_currency": "NXA",
    "to_currency": "USDT"
  }'`,
    response: `{
  "transaction_id": "tx-uuid",
  "amount": 1000,
  "fee": 5.0,
  "burn_amount": 0.5,
  "burn_id": "burn-uuid",
  "burn_rate_percent": 10,
  "type": "swap",
  "from_currency": "NXA",
  "to_currency": "USDT"
}`,
  },
  {
    method: "POST",
    path: "/burn",
    title: "Manual Burn",
    description: "Manually burn NXA tokens from your wallet. Deducts from balance and adds to global burn total.",
    auth: true,
    permissions: ["burn"],
    bodyParams: [
      { name: "amount", type: "number", required: true, description: "Amount of NXA to burn (max 1,000,000)" },
    ],
    curl: `curl -s -X POST "${BASE_URL}/burn" \\
  -H "X-API-Key: nxa_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 100}'`,
    response: `{
  "burn_id": "burn-uuid",
  "amount": 100,
  "remaining_balance": 15320.75
}`,
  },
  {
    method: "POST",
    path: "/transfer",
    title: "Transfer NXA",
    description: "Transfer NXA tokens to another user by their user ID. Requires Bearer token auth (not API key).",
    auth: true,
    permissions: ["transfer"],
    bodyParams: [
      { name: "amount", type: "number", required: true, description: "Amount to transfer" },
      { name: "recipient_id", type: "string", required: true, description: "Recipient's user ID" },
    ],
    curl: `curl -s -X POST "${BASE_URL}/transfer" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 250,
    "recipient_id": "recipient-user-uuid"
  }'`,
    response: `{
  "transaction_id": "tx-uuid",
  "amount": 250,
  "recipient_id": "recipient-user-uuid",
  "sender_remaining": 15070.75
}`,
  },
];

// ─── SDK Snippet Generators ───

type Lang = "fetch" | "node" | "python" | "sdk";

function buildQuery(ep: Endpoint): string {
  if (!ep.params || ep.params.length === 0) return "";
  const sample = ep.params.map((p) => `${p.name}=${p.type === "number" ? "10" : "value"}`).join("&");
  return `?${sample}`;
}

function buildBodyObject(ep: Endpoint): string {
  if (!ep.bodyParams || ep.bodyParams.length === 0) return "{}";
  const lines = ep.bodyParams.map((p) => {
    const v = p.type === "number" ? "100" : `"${p.name === "recipient_id" ? "recipient-user-uuid" : "value"}"`;
    return `  ${p.name}: ${v}`;
  });
  return `{\n${lines.join(",\n")}\n}`;
}

function buildPyDict(ep: Endpoint): string {
  if (!ep.bodyParams || ep.bodyParams.length === 0) return "{}";
  const lines = ep.bodyParams.map((p) => {
    const v = p.type === "number" ? "100" : `"${p.name === "recipient_id" ? "recipient-user-uuid" : "value"}"`;
    return `  "${p.name}": ${v}`;
  });
  return `{\n${lines.join(",\n")}\n}`;
}

function authHeadersJs(ep: Endpoint): string {
  if (!ep.auth) return "";
  if (ep.permissions?.includes("transfer")) {
    return `    "Authorization": "Bearer " + JWT_TOKEN,\n`;
  }
  return `    "X-API-Key": API_KEY,\n`;
}

function authHeadersPy(ep: Endpoint): string {
  if (!ep.auth) return "";
  if (ep.permissions?.includes("transfer")) {
    return `    "Authorization": f"Bearer {JWT_TOKEN}",\n`;
  }
  return `    "X-API-Key": API_KEY,\n`;
}

function generateSnippet(ep: Endpoint, lang: Lang): string {
  const url = `${BASE_URL}${ep.path}${buildQuery(ep)}`;
  const hasBody = ep.method === "POST";
  const credDecl = ep.auth
    ? ep.permissions?.includes("transfer")
      ? `const JWT_TOKEN = "your_jwt_token_here";\n`
      : `const API_KEY = "nxa_your_api_key_here";\n`
    : "";
  const credDeclPy = ep.auth
    ? ep.permissions?.includes("transfer")
      ? `JWT_TOKEN = "your_jwt_token_here"\n`
      : `API_KEY = "nxa_your_api_key_here"\n`
    : "";

  if (lang === "fetch") {
    return `${credDecl}
const res = await fetch("${url}", {
  method: "${ep.method}",
  headers: {
${authHeadersJs(ep)}    "Content-Type": "application/json",
  },${hasBody ? `\n  body: JSON.stringify(${buildBodyObject(ep)}),` : ""}
});
const data = await res.json();
console.log(data);`;
  }

  if (lang === "node") {
    return `// npm install axios
import axios from "axios";

${credDecl}
const { data } = await axios({
  method: "${ep.method.toLowerCase()}",
  url: "${url}",
  headers: {
${authHeadersJs(ep)}    "Content-Type": "application/json",
  },${hasBody ? `\n  data: ${buildBodyObject(ep)},` : ""}
});
console.log(data);`;
  }

  if (lang === "python") {
    return `# pip install requests
import requests

${credDeclPy}
response = requests.${ep.method.toLowerCase()}(
  "${url}",
  headers={
${authHeadersPy(ep)}    "Content-Type": "application/json",
  },${hasBody ? `\n  json=${buildPyDict(ep)},` : ""}
)
print(response.json())`;
  }

  // SDK style
  const fnName = ep.path.replace(/\//g, "").replace(/-/g, "_") || "health";
  const args = hasBody && ep.bodyParams
    ? `{ ${ep.bodyParams.map((p) => p.name).join(", ")} }`
    : ep.params && ep.params.length
      ? `{ ${ep.params.map((p) => p.name).join(", ")} }`
      : "";
  return `// Using the NexaCoin SDK
import { NxaClient } from "@nexa/web3-sdk";

const nxa = new NxaClient({
  ${ep.auth ? (ep.permissions?.includes("transfer") ? 'jwt: "your_jwt_token"' : 'apiKey: "nxa_your_api_key"') : "// no auth required"}
});

const result = await nxa.${fnName}(${args});
console.log(result);`;
}

function SnippetTabs({ ep }: { ep: Endpoint }) {
  return (
    <Tabs defaultValue="fetch" className="w-full">
      <TabsList className="grid w-full grid-cols-4 h-9">
        <TabsTrigger value="fetch" className="text-xs">JS Fetch</TabsTrigger>
        <TabsTrigger value="node" className="text-xs">Node.js</TabsTrigger>
        <TabsTrigger value="python" className="text-xs">Python</TabsTrigger>
        <TabsTrigger value="sdk" className="text-xs">SDK</TabsTrigger>
      </TabsList>
      {(["fetch", "node", "python", "sdk"] as Lang[]).map((l) => (
        <TabsContent key={l} value={l} className="mt-2">
          <CodeBlock code={generateSnippet(ep, l)} language={l === "python" ? "python" : "javascript"} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

const SDK_BOOTSTRAP = `// nxa-sdk.ts — drop into your project
const BASE_URL = "${BASE_URL}";

export interface NxaClientOptions {
  apiKey?: string;
  jwt?: string;
}

export class NxaClient {
  private headers: Record<string, string>;

  constructor(opts: NxaClientOptions = {}) {
    this.headers = { "Content-Type": "application/json" };
    if (opts.apiKey) this.headers["X-API-Key"] = opts.apiKey;
    if (opts.jwt) this.headers["Authorization"] = \`Bearer \${opts.jwt}\`;
  }

  private async request<T>(method: string, path: string, body?: unknown, query?: Record<string, unknown>): Promise<T> {
    const qs = query ? "?" + new URLSearchParams(query as Record<string, string>).toString() : "";
    const res = await fetch(\`\${BASE_URL}\${path}\${qs}\`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(\`NXA API \${res.status}: \${await res.text()}\`);
    return res.json() as Promise<T>;
  }

  health()       { return this.request("GET", "/health"); }
  price()        { return this.request("GET", "/price"); }
  supply()       { return this.request("GET", "/supply"); }
  leaderboard(q: { limit?: number } = {}) { return this.request("GET", "/leaderboard", undefined, q); }
  balance()      { return this.request("GET", "/balance"); }
  burns(q: { limit?: number } = {})       { return this.request("GET", "/burns", undefined, q); }
  trade(body: { amount: number; type?: string; from_currency?: string; to_currency?: string }) {
    return this.request("POST", "/trade", body);
  }
  burn(body: { amount: number })          { return this.request("POST", "/burn", body); }
  transfer(body: { amount: number; recipient_id: string }) {
    return this.request("POST", "/transfer", body);
  }
}

// Usage:
// const nxa = new NxaClient({ apiKey: "nxa_..." });
// const { balance } = await nxa.balance();
`;

const ApiDocs = () => {
  const navigate = useNavigate();
  const publicEndpoints = endpoints.filter((e) => !e.auth);
  const authEndpoints = endpoints.filter((e) => e.auth);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">NXA Web3 API</h1>
              <p className="text-xs text-muted-foreground">v1.0.0 · REST · JSON</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Intro */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="pt-5 pb-4 flex items-start gap-3">
              <Globe className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-foreground">Base URL</p>
                <code className="text-xs text-muted-foreground break-all">{BASE_URL}</code>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-5 pb-4 flex items-start gap-3">
              <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-foreground">Format</p>
                <p className="text-xs text-muted-foreground">JSON request & response bodies</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-5 pb-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-foreground">Auth</p>
                <p className="text-xs text-muted-foreground">API Key, Wallet Signature, or Bearer JWT</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Auth Section */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Authentication
            </CardTitle>
            <CardDescription>Three methods supported — choose one per request.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="apikey" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="apikey">API Key</TabsTrigger>
                <TabsTrigger value="wallet">Wallet Signature</TabsTrigger>
                <TabsTrigger value="bearer">Bearer Token</TabsTrigger>
              </TabsList>
              <TabsContent value="apikey" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Pass your key in the <code className="text-xs bg-muted px-1.5 py-0.5 rounded">X-API-Key</code> header. Keys are generated in the Admin dashboard and grant specific permissions.
                </p>
                <CodeBlock code={`curl -H "X-API-Key: nxa_abc123def456..." \\
  "${BASE_URL}/balance"`} />
              </TabsContent>
              <TabsContent value="wallet" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign a message containing <code className="text-xs bg-muted px-1.5 py-0.5 rounded">timestamp:UNIX_SECONDS</code> with your wallet. Include three headers. Signature must be &lt;5 min old.
                </p>
                <CodeBlock code={`curl \\
  -H "X-Wallet-Address: 0xYourAddress" \\
  -H "X-Wallet-Signature: 0xSignedMessage" \\
  -H "X-Wallet-Message: NXA Auth timestamp:1713264000" \\
  "${BASE_URL}/balance"`} />
              </TabsContent>
              <TabsContent value="bearer" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Use a Lovable Cloud JWT token. This is the only method that grants the <code className="text-xs bg-muted px-1.5 py-0.5 rounded">transfer</code> permission.
                </p>
                <CodeBlock code={`curl -H "Authorization: Bearer eyJhbG..." \\
  "${BASE_URL}/balance"`} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* SDK Quick-start */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" /> JavaScript SDK
            </CardTitle>
            <CardDescription>
              Drop-in TypeScript client wrapping every endpoint. Copy the snippet, save as <code className="text-xs bg-muted px-1.5 py-0.5 rounded">nxa-sdk.ts</code>, and import.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock code={SDK_BOOTSTRAP} language="typescript" />
          </CardContent>
        </Card>

        {/* Endpoints */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Public Endpoints</h2>
          </div>
          <Accordion type="multiple" className="space-y-3">
            {publicEndpoints.map((ep) => (
              <EndpointCard key={ep.path + ep.method} ep={ep} />
            ))}
          </Accordion>

          <div className="flex items-center gap-2 pt-4">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Authenticated Endpoints</h2>
          </div>
          <Accordion type="multiple" className="space-y-3">
            {authEndpoints.map((ep) => (
              <EndpointCard key={ep.path + ep.method} ep={ep} />
            ))}
          </Accordion>
        </div>

        {/* Error Codes */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Error Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              {[
                ["400", "Bad request — invalid or missing body parameters"],
                ["401", "Authentication failed — invalid key, expired signature, or bad token"],
                ["403", "Permission denied — key lacks the required permission"],
                ["404", "Endpoint not found or recipient not found"],
                ["500", "Server error — check response body for details"],
              ].map(([code, desc]) => (
                <div key={code} className="contents">
                  <code className="font-mono text-xs text-destructive font-semibold">{code}</code>
                  <span className="text-muted-foreground text-xs">{desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <CodeBlock
                code={`{
  "error": "Invalid or inactive API key"
}`}
                language="json"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function EndpointCard({ ep }: { ep: Endpoint }) {
  return (
    <AccordionItem value={ep.method + ep.path} className="border border-border rounded-lg overflow-hidden">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
        <div className="flex items-center gap-3 text-left">
          <Badge variant="outline" className={`${methodColors[ep.method]} font-mono text-[10px] px-2 py-0.5`}>
            {ep.method}
          </Badge>
          <code className="text-sm font-semibold text-foreground">{ep.path}</code>
          <span className="text-xs text-muted-foreground hidden sm:inline">— {ep.title}</span>
          {ep.auth && <Lock className="w-3 h-3 text-muted-foreground" />}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 space-y-4">
        <p className="text-sm text-muted-foreground">{ep.description}</p>

        {ep.permissions && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Required permissions:</span>
            {ep.permissions.map((p) => (
              <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
            ))}
          </div>
        )}

        {ep.params && (
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Query Parameters</p>
            <div className="space-y-1">
              {ep.params.map((p) => (
                <div key={p.name} className="flex items-baseline gap-2 text-xs">
                  <code className="text-primary font-mono">{p.name}</code>
                  <span className="text-muted-foreground">{p.type}</span>
                  {p.required && <Badge variant="destructive" className="text-[9px] px-1 py-0">required</Badge>}
                  <span className="text-muted-foreground">— {p.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {ep.bodyParams && (
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Request Body</p>
            <div className="space-y-1">
              {ep.bodyParams.map((p) => (
                <div key={p.name} className="flex items-baseline gap-2 text-xs flex-wrap">
                  <code className="text-primary font-mono">{p.name}</code>
                  <span className="text-muted-foreground">{p.type}</span>
                  {p.required && <Badge variant="destructive" className="text-[9px] px-1 py-0">required</Badge>}
                  <span className="text-muted-foreground">— {p.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-foreground mb-2">Example Request</p>
          <CodeBlock code={ep.curl} />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground mb-2">Example Response</p>
          <CodeBlock code={ep.response} language="json" />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export default ApiDocs;
