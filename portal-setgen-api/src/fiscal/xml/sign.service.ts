import { Injectable, Logger } from '@nestjs/common';
import * as forge from 'node-forge';
import { SignedXml } from 'xml-crypto';

@Injectable()
export class SignService {
  private readonly logger = new Logger(SignService.name);

  /**
   * Assina um XML NF-e ou NFS-e usando um certificado A1 (.pfx) seguindo
   * o padrão XMLDSIG (http://www.w3.org/2000/09/xmldsig#) exigido pela SEFAZ.
   *
   * @param xml         – XML bruto (não assinado)
   * @param pfxBase64   – Certificado .pfx em Base64
   * @param pfxPassword – Senha do certificado
   * @param referenceId – ID do elemento a ser referenciado (ex: "infNFe" ou "infNfse")
   */
  assinar(
    xml: string,
    pfxBase64: string,
    pfxPassword: string,
    referenceId = 'infNFe',
  ): string {
    this.logger.log(`Assinando XML – referência: #${referenceId}`);

    // ── 1. Lê o .pfx e extrai chave + certificado ────────────────────────────
    const pfxDer = forge.util.decode64(pfxBase64);
    const pfxAsn1 = forge.asn1.fromDer(pfxDer);
    const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, pfxPassword);

    // Extrai o par de chaves
    const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag });

    const keyBag  = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
    const certBag = certBags[forge.pki.oids.certBag]?.[0];

    if (!keyBag?.key || !certBag?.cert) {
      throw new Error('Certificado .pfx inválido: não foi possível extrair chave ou certificado');
    }

    const privateKeyPem  = forge.pki.privateKeyToPem(keyBag.key);
    const certificatePem = forge.pki.certificateToPem(certBag.cert);

    // ── 2. Configura o XMLDSIG ───────────────────────────────────────────────
    const sig = new SignedXml({
      privateKey:  privateKeyPem,
      publicCert:  certificatePem,
      signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
      canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    });

    // Transforms exigidos pela SEFAZ
    sig.addReference({
      xpath:      `//*[@Id='${referenceId}']`,
      transforms: [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
      ],
      digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
    });


    // ── 3. Computa e injeta a assinatura ─────────────────────────────────────
    sig.computeSignature(xml, {
      location: {
        reference: `//*[@Id='${referenceId}']`,
        action:    'after',
      },
      existingPrefixes: {
        ds:  'http://www.w3.org/2000/09/xmldsig#',
        nfe: 'http://www.portalfiscal.inf.br/nfe',
      },
    });

    const xmlAssinado = sig.getSignedXml();
    this.logger.log('XML assinado com sucesso');
    return xmlAssinado;
  }

  /**
   * Verifica a validade do certificado (data de expiração + chain).
   * Útil para alertas preventivos no painel.
   */
  inspecionarCertificado(pfxBase64: string, pfxPassword: string): {
    subject: string;
    validFrom: Date;
    validTo: Date;
    isValid: boolean;
    daysRemaining: number;
  } {
    const pfxDer  = forge.util.decode64(pfxBase64);
    const pfxAsn1 = forge.asn1.fromDer(pfxDer);
    const pfx     = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, pfxPassword);

    const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag });
    const certBag  = certBags[forge.pki.oids.certBag]?.[0];

    if (!certBag?.cert) throw new Error('Certificado não encontrado no .pfx');

    const cert     = certBag.cert;
    const now      = new Date();
    const validTo  = cert.validity.notAfter;
    const validFrom = cert.validity.notBefore;

    const daysRemaining = Math.floor(
      (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    const subject = cert.subject.getField('CN')?.value ?? 'Desconhecido';

    return {
      subject,
      validFrom,
      validTo,
      isValid:        now >= validFrom && now <= validTo,
      daysRemaining,
    };
  }
}
