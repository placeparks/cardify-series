/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ethers, Log } from "ethers";

/* ─── env vars you already set ───────────────────────────── */

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS_NFT_ONLY!;
const WALLET_KEY      = process.env.WALLET_PRIVATE_KEY!;
const SUPABASE_URL    = process.env.SUPABASE_URL!;
const SUPABASE_SVC    = process.env.SUPABASE_SERVICE_KEY!;

/* ─── misc constants (only used for UI logs) ─────────────── */

const MARKETPLACE = "0x7147D585a07Bc5E0FB5f740cf508D53b57091bab";

/* ─── factory ABI – 7-arg createCollection ──────────────── */

const FACTORY_ABI = [
  {
    name: "createCollection",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name_",            type: "string"  },
      { name: "symbol_",          type: "string"  },
      { name: "baseURI_",         type: "string"  },
      { name: "maxSupply_",       type: "uint256" },
      { name: "mintPrice_",       type: "uint256" },
      { name: "royaltyBps_",      type: "uint96"  },
      { name: "royaltyReceiver_", type: "address" }
    ],
    outputs: [{ name: "clone", type: "address" }]
  },
  {
    name: "CollectionDeployed",
    type: "event",
    anonymous: false,
    inputs: [
      { indexed: true,  name: "creator",         type: "address" },
      { indexed: false, name: "collection",      type: "address" },
      { indexed: false, name: "name",            type: "string"  },
      { indexed: false, name: "symbol",          type: "string"  },
      { indexed: false, name: "mintPrice",       type: "uint256" },
      { indexed: false, name: "royaltyBps",      type: "uint96"  },
      { indexed: false, name: "royaltyReceiver", type: "address" }
    ]
  }
] as const;

/* helper that never throws – returns undefined if parse fails */
const safeParse = (iface: ethers.Interface, log: Log) =>
  ((): ethers.LogDescription | undefined => {
    try { return iface.parseLog(log); } catch { return undefined; }
  })();

/* ─── handler ────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    /* ── 1. read body ────────────────────────────────────── */
    const {
      name, symbol, description, baseUri,
      maxSupply, mintPrice, royaltyBps,
      royaltyRecipient, ownerAddress
    } = await req.json();

    if (!name || !symbol || !baseUri || !maxSupply || !ownerAddress) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (maxSupply < 5 || maxSupply > 1000) {
      return NextResponse.json(
        { success: false, error: "Max supply must be between 5 and 1000" },
        { status: 400 }
      );
    }

    /* ── 2. Supabase user + credit check ─────────────────── */
    const supabase = createClient(SUPABASE_URL, SUPABASE_SVC);

    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid authentication" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < 20) {
      return NextResponse.json(
        { success: false, error: "Insufficient credits (need 20)" },
        { status: 400 }
      );
    }

    /* ── 3. deploy collection ────────────────────────────── */
    const provider    = new ethers.JsonRpcProvider("https://sepolia.base.org");
    const adminWallet = new ethers.Wallet(WALLET_KEY, provider);
    const factory     = new ethers.Contract(
      FACTORY_ADDRESS, FACTORY_ABI, adminWallet
    );

    const mintWei = ethers.parseEther(mintPrice.toString());
    const ipfsURL = baseUri.replace(
      "https://gateway.pinata.cloud/ipfs/", "ipfs://"
    );

    const tx       = await factory.createCollection(
      name, symbol, ipfsURL, maxSupply, mintWei, royaltyBps, royaltyRecipient
    ); // ← exactly 7 arguments
    const receipt  = await tx.wait();

    /* ── 4. find CollectionDeployed event ────────────────── */
    const iface      = factory.interface;
    const parsedLog  = receipt.logs.map(l => safeParse(iface, l))
                                   .find(l => l?.name === "CollectionDeployed");

    if (!parsedLog) throw new Error("CollectionDeployed event not found");
    const collectionAddress: string = parsedLog.args!.collection;

    /* ── 5. verify + transfer ownership ──────────────────── */
    const colAbi = [
      "function owner() view returns (address)",
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function maxSupply() view returns (uint256)",
      "function mintPrice() view returns (uint256)",
      "function transferOwnership(address)"
    ];
    const collection = new ethers.Contract(
      collectionAddress, colAbi, adminWallet
    );

    // basic sanity checks
    const ownerNow = await collection.owner();
    if (ownerNow.toLowerCase() !== adminWallet.address.toLowerCase()) {
      throw new Error(`owner() mismatch: ${ownerNow}`);
    }

    await (await collection.transferOwnership(ownerAddress)).wait();

    /* ── 6. DB write & credit deduction ──────────────────── */
    const cid = (() => {
      try {
        const [, id] = new URL(baseUri).pathname.split("/ipfs/");
        return id ?? null;
      } catch { return null; }
    })();

    await supabase.from("nft_collections").insert({
      collection_address: collectionAddress.toLowerCase(),
      owner_address:      ownerAddress.toLowerCase(),
      user_id:            user.id,
      name, symbol, description,
      base_uri:   ipfsURL,
      image_uri:  baseUri,
      max_supply: maxSupply,
      mint_price: mintWei.toString(),
      royalty_bps: royaltyBps,
      royalty_recipient: royaltyRecipient.toLowerCase(),
      cid,
      active: true
    });

    await supabase.from("profiles")
      .update({ credits: profile.credits - 20 })
      .eq("id", user.id);

    /* ── 7. done ─────────────────────────────────────────── */
    return NextResponse.json({
      success: true,
      collectionAddress,
      transactionHash: receipt.hash,
      creditsDeducted: 20,
      message: "NFT collection deployed successfully!"
    });

  } catch (err: any) {
    console.error("❌ deploy-nft-collection:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
