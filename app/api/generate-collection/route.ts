// app/api/nft/erc1155/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/* ──────────────────────────────────────────────────────────────────────────
   ✅ ABI: must match your deployed Solidity exactly
   - constructor(address mp)
   - createCollection(
       string baseUri,
       string name_,
       string symbol_,
       string description,
       uint256 mintPrice,
       uint256 maxSupply,
       address royaltyRecip,
       uint96  royaltyBps
     ) returns (address)
   - event CollectionDeployed(address indexed creator, address collection)
   - setMarketplace(address)
   - isCardifyCollection(address) view returns (bool)
   ------------------------------------------------------------------------- */
const erc1155FactoryAbi = [
  {
    inputs: [{ internalType: "address", name: "mp", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "address", name: "collection", type: "address" },
    ],
    name: "CollectionDeployed",
    type: "event",
  },
  {
    inputs: [
      { internalType: "string", name: "baseUri", type: "string" },
      { internalType: "string", name: "name_", type: "string" },
      { internalType: "string", name: "symbol_", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "uint256", name: "mintPrice", type: "uint256" },
      { internalType: "uint256", name: "maxSupply", type: "uint256" },
      { internalType: "address", name: "royaltyRecip", type: "address" },
      { internalType: "uint96", name: "royaltyBps", type: "uint96" },
    ],
    name: "createCollection",
    outputs: [{ internalType: "address", name: "col", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "mp", type: "address" }],
    name: "setMarketplace",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "col", type: "address" }],
    name: "isCardifyCollection",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/* ──────────────────────────────────────────────────────────────────────────
   Types
   ------------------------------------------------------------------------- */
interface GenerateCollectionRequest {
  collectionNumber: number;
  name: string;
  symbol: string;
  image: string; // Gateway URL or ipfs://
  description?: string;
  maxSupply: number;
  royaltyRecipient?: string;
  royaltyBps?: number; // default 250 = 2.5%
}

interface GenerateCollectionResponse {
  success: boolean;
  collectionAddress?: string;
  codes?: string[];
  transactionHash?: string;
  error?: string;
  creditsDeducted?: number;
  newCreditBalance?: number | "unknown";
  collection?: {
    address: string;
    name: string;
    symbol: string;
    maxSupply: number;
    active: boolean;
    type: "erc1155";
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Env / Config
   ------------------------------------------------------------------------- */
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  NEXT_PUBLIC_FACTORY_ADDRESS_ERC1155,
  NEXT_PUBLIC_RPC_URL,
  WALLET_PRIVATE_KEY,
} = process.env;

const RPC_URL =
  NEXT_PUBLIC_RPC_URL ||
  "https://sepolia.infura.io/v3/YOUR_PROJECT_ID"; // default fallback

const FACTORY_ADDRESS = NEXT_PUBLIC_FACTORY_ADDRESS_ERC1155 || "";
const PRIVATE_KEY = WALLET_PRIVATE_KEY || "";

const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

/* ──────────────────────────────────────────────────────────────────────────
   Helpers
   ------------------------------------------------------------------------- */

// Normalize any gateway URL (or raw CID) to ipfs://CID/
function toIpfsBaseUri(input: string): string {
  // Already ipfs://
  if (input.startsWith("ipfs://")) {
    // ensure trailing slash for base URIs
    return input.endsWith("/") ? input : `${input}/`;
  }
  // If full gateway URL or path, try to pull CID
  const cid = extractCidFromPinataUrl(input);
  if (cid) return `ipfs://${cid}/`;
  // As a last resort, pass through, but base URIs should end with '/'
  return input.endsWith("/") ? input : `${input}/`;
}

// Extract CID from common gateway URLs
function extractCidFromPinataUrl(pinataUrl: string): string | null {
  try {
    if (!pinataUrl.includes("://")) {
      // Maybe the user passed a bare CID
      if (pinataUrl.startsWith("Qm") || pinataUrl.startsWith("bafy")) return pinataUrl;
      return null;
    }
    const url = new URL(pinataUrl);
    // Forms like /ipfs/<cid>/...
    const parts = url.pathname.split("/").filter(Boolean);
    const ipfsIdx = parts.findIndex((p) => p === "ipfs");
    if (ipfsIdx !== -1 && parts[ipfsIdx + 1]) return parts[ipfsIdx + 1];

    // Fallback: last segment looks like a CID
    const last = parts[parts.length - 1];
    if (last && (last.startsWith("Qm") || last.startsWith("bafy"))) return last;

    return null;
  } catch {
    return null;
  }
}

function generateRandomCodes(count: number): string[] {
  const codes: string[] = [];
  const used = new Set<string>();
  while (codes.length < count) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    if (!used.has(code)) {
      used.add(code);
      codes.push(code);
    }
  }
  return codes;
}

function ensureEnv(): string[] {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_KEY) missing.push("SUPABASE_SERVICE_KEY");
  if (!FACTORY_ADDRESS) missing.push("NEXT_PUBLIC_FACTORY_ADDRESS_ERC1155");
  if (!RPC_URL) missing.push("NEXT_PUBLIC_RPC_URL");
  if (!PRIVATE_KEY) missing.push("WALLET_PRIVATE_KEY");
  return missing;
}

/* ──────────────────────────────────────────────────────────────────────────
   POST handler
   ------------------------------------------------------------------------- */
export async function POST(
  req: NextRequest
): Promise<NextResponse<GenerateCollectionResponse>> {
  console.log("🚀 [NFT Collection] Starting collection generation...");

  const missing = ensureEnv();
  if (missing.length) {
    return NextResponse.json(
      {
        success: false,
        error: `Missing env: ${missing.join(", ")}`,
      },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as GenerateCollectionRequest;

    console.log("📝 [NFT Collection] Request body:", {
      collectionNumber: body.collectionNumber,
      name: body.name,
      symbol: body.symbol,
      maxSupply: body.maxSupply,
      imageLength: body.image?.length || 0,
    });

    // Input validation
    if (!body.collectionNumber || !body.name || !body.symbol || !body.image || !body.maxSupply) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: collectionNumber, name, symbol, image, maxSupply",
        },
        { status: 400 }
      );
    }
    if (body.maxSupply <= 0) {
      return NextResponse.json(
        { success: false, error: "maxSupply must be > 0" },
        { status: 400 }
      );
    }
    const royaltyBps = body.royaltyBps ?? 250;
    if (royaltyBps < 0 || royaltyBps > 10_000) {
      return NextResponse.json(
        { success: false, error: "royaltyBps must be between 0 and 10_000" },
        { status: 400 }
      );
    }

    /* ── Auth: Bearer Supabase JWT ─────────────────────────────────────── */
    console.log("🔐 [NFT Collection] Checking authentication...");
    const authHeader = req.headers.get("authorization");
    console.log("🔑 [NFT Collection] Auth header present:", !!authHeader);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    console.log("👤 [NFT Collection] User authenticated:", !!user, "Error:", authError?.message);
    if (!user || authError) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    /* ── Credits check ─────────────────────────────────────────────────── */
    console.log("💰 [NFT Collection] Checking user credits...");
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    console.log("💳 [NFT Collection] Profile data:", {
      credits: profile?.credits,
      error: profileError?.message,
    });

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      );
    }

    const requiredCredits = 10;
    console.log("💵 [NFT Collection] Credit check:", {
      userCredits: profile.credits,
      required: requiredCredits,
    });

    if (profile.credits < requiredCredits) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient credits. You need ${requiredCredits} credits for NFT generation.`,
        },
        { status: 400 }
      );
    }

    /* ── Chain setup ───────────────────────────────────────────────────── */
    console.log("🔗 [NFT Collection] Setting up blockchain connection...");
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log("👛 [NFT Collection] Wallet address:", wallet.address);

    // Verify factory address has code (catch wrong network / bad address)
    const code = await provider.getCode(FACTORY_ADDRESS);
    if (!code || code === "0x") {
      return NextResponse.json(
        {
          success: false,
          error: `No code at FACTORY_ADDRESS (${FACTORY_ADDRESS}) on current RPC; check network/env.`,
        },
        { status: 500 }
      );
    }

    /* ── Build call args with CORRECT ORDER ─────────────────────────────── */
    // Convert any gateway URL to base ipfs://CID/
    const baseUri = toIpfsBaseUri(body.image); // ensure trailing "/"
    const name_ = body.name;
    const symbol_ = body.symbol;
    const description = body.description ?? "";
    const mintPriceWei = 0n; // free mints as per your spec
    const maxSupply = BigInt(body.maxSupply);
    const royaltyRecip =
      body.royaltyRecipient && ethers.isAddress(body.royaltyRecipient)
        ? body.royaltyRecipient
        : wallet.address;

    if (royaltyBps > 0 && (!royaltyRecip || royaltyRecip === ethers.ZeroAddress)) {
      return NextResponse.json(
        { success: false, error: "royaltyRecipient required when royaltyBps > 0" },
        { status: 400 }
      );
    }

    // Prepare factory
    const factory = new ethers.Contract(FACTORY_ADDRESS, erc1155FactoryAbi, wallet);

    console.log("🏭 [NFT Collection] Factory address:", FACTORY_ADDRESS);
    console.log("📋 [NFT Collection] Collection params:", {
      baseUri,
      name: name_,
      symbol: symbol_,
      description,
      mintPriceWei: mintPriceWei.toString(),
      maxSupply: maxSupply.toString(),
      royaltyRecip,
      royaltyBps,
    });

    // Generate codes (optional; used later if your collection supports it)
    console.log("🎲 [NFT Collection] Generating codes...");
    const codes = generateRandomCodes(body.maxSupply);
    const hashes = codes.map((c) => ethers.keccak256(ethers.toUtf8Bytes(c)));
    console.log("🔐 [NFT Collection] Generated", codes.length, "codes");

    /* ── Execute tx ─────────────────────────────────────────────────────── */
    console.log("📄 [NFT Collection] Deploying contract...");
    const tx = await factory.createCollection(
      baseUri,       // string baseUri
      name_,         // string name_
      symbol_,       // string symbol_
      description,   // string description
      mintPriceWei,  // uint256 mintPrice
      maxSupply,     // uint256 maxSupply
      royaltyRecip,  // address royaltyRecip
      royaltyBps     // uint96  royaltyBps
    );

    console.log("⏳ [NFT Collection] Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ [NFT Collection] Tx confirmed:", receipt?.hash);

    // Parse CollectionDeployed event
    let collectionAddress = "";
    try {
      const iface = new ethers.Interface(erc1155FactoryAbi as any);
      for (const log of receipt!.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "CollectionDeployed") {
            collectionAddress = parsed.args.collection as string;
            break;
          }
        } catch {
          // ignore non-matching log
        }
      }
    } catch (e) {
      // fallback: try to read from return (not always available with proxies)
    }

    if (!collectionAddress) {
      // As a fallback, call a view (if you maintain an index) or throw:
      throw new Error("Collection deployment event not found");
    }

    console.log("📍 [NFT Collection] Collection address:", collectionAddress);

    /* ── Optionally push codes to collection (if method exists) ─────────── */
    try {
      console.log("⏳ [NFT Collection] Waiting before adding codes...");
      await new Promise((r) => setTimeout(r, 1500));

      // Minimal ABI for addValidCodes
      const codeAbi = [
        {
          inputs: [{ internalType: "bytes32[]", name: "hashes", type: "bytes32[]" }],
          name: "addValidCodes",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ] as const;

      const candidate = new ethers.Contract(collectionAddress, codeAbi, wallet);

      // Quick interface probe (won’t catch all cases but prevents obvious bad calls)
      const sel = new ethers.Interface(codeAbi).getFunction("addValidCodes").selector;
      // Try static call first to avoid wasting gas if function is absent / guarded
      await candidate.addValidCodes.staticCall(hashes);
      console.log(`📦 [NFT Collection] Adding ${hashes.length} codes in one transaction...`);
      const addCodesTx = await candidate.addValidCodes(hashes);
      console.log("⏳ [NFT Collection] Codes tx sent:", addCodesTx.hash);
      await addCodesTx.wait();
      console.log("✅ [NFT Collection] All codes added successfully");
    } catch (err) {
      console.log(
        "⚠️ [NFT Collection] Skipping addValidCodes (method missing or guarded):",
        (err as Error)?.message
      );
    }

    /* ── DB writes ──────────────────────────────────────────────────────── */
    const pinataCid = extractCidFromPinataUrl(body.image);

    console.log("💾 [NFT Collection] Storing collection in database...", {
      address: collectionAddress.toLowerCase(),
      name: body.name,
      symbol: body.symbol,
      maxSupply: body.maxSupply,
      active: true,
    });

    const { error: collectionError } = await supabaseAdmin.from("collections").insert({
      address: collectionAddress.toLowerCase(),
      owner: user.id,
      cid: pinataCid,
      collection_type: "erc1155",
      name: body.name,
      symbol: body.symbol,
      description: body.description ?? "",
      max_supply: body.maxSupply,
      mint_price: 0,
      image_uri: body.image,
      base_uri: toIpfsBaseUri(body.image), // normalized ipfs base
      royalty_recipient: royaltyRecip,
      royalty_bps: royaltyBps,
      active: true,
      created_at: new Date().toISOString(),
    });

    if (collectionError) {
      return NextResponse.json(
        { success: false, error: "Failed to store collection in database" },
        { status: 500 }
      );
    }

    // Store codes if you use codes on frontend later
    try {
      const codesRows = codes.map((code, i) => ({
        collection_address: collectionAddress.toLowerCase(),
        code,
        hash: hashes[i],
        used: false,
        used_by: null,
        used_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      const { error: codesError } = await supabaseAdmin
        .from("collection_codes")
        .insert(codesRows);
      if (codesError) {
        console.log("⚠️ [NFT Collection] Error storing codes:", codesError.message);
      }
    } catch (e) {
      console.log("⚠️ [NFT Collection] Skipping code rows:", (e as Error)?.message);
    }

    // Deduct credits
    const { error: creditError } = await supabaseAdmin
      .from("profiles")
      .update({ credits: profile.credits - requiredCredits })
      .eq("id", user.id);

    if (creditError) {
      return NextResponse.json(
        { success: false, error: "Failed to deduct credits" },
        { status: 500 }
      );
    }

    // Verify credits
    const { data: updatedProfile } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      success: true,
      collectionAddress,
      codes,
      transactionHash: receipt!.hash,
      creditsDeducted: requiredCredits,
      newCreditBalance: updatedProfile?.credits ?? "unknown",
      collection: {
        address: collectionAddress,
        name: body.name,
        symbol: body.symbol,
        maxSupply: body.maxSupply,
        active: true,
        type: "erc1155",
      },
    });
  } catch (error) {
    console.error("💥 [NFT Collection] Error generating collection:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
