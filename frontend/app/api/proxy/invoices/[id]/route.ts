import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session || !session.accessToken) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const response = await fetch(`${API_URL}/invoices/${id}/download`, {
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Backend Invoice Error:", response.status, errorText);
            return NextResponse.json(
                { success: false, message: "Failed to fetch invoice from backend" },
                { status: response.status }
            );
        }

        // Forward the PDF response
        const blob = await response.blob();
        const headers = new Headers();
        headers.set("Content-Type", "application/pdf");
        headers.set(
            "Content-Disposition",
            `attachment; filename="invoice-${id}.pdf"`
        );

        return new NextResponse(blob, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error("Proxy Invoice Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
