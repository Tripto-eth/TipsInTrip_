import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Al momento simuliamo solo l'invio. 
    // Quando avrai Mailchimp/Resend, qui chiamerai la loro API per mandare la mail.
    console.log("---- NUOVA RICHIESTA LOCAL EXPERT ----");
    console.log(`Guida: ${data.guideName} (${data.destination})`);
    console.log(`Nome Cliente: ${data.name}`);
    console.log(`Email Cliente: ${data.email}`);
    console.log(`Date: ${data.dateStart} - ${data.dateEnd}`);
    console.log(`Interessi: ${data.tags?.join(', ')}`);
    console.log(`Note: ${data.notes}`);
    console.log("--------------------------------------");

    // Simuliamo un leggero ritardo di rete per far vedere lo stato di "loading"
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({ success: true, message: "Email inviata con successo" });
  } catch (error) {
    console.error("Errore nell'invio della richiesta guida:", error);
    return NextResponse.json(
      { error: "Errore durante l'invio della richiesta" },
      { status: 500 }
    );
  }
}
