package utils

import (
	"backend/internal/models"
	"encoding/base64"
	"fmt"

	"github.com/jung-kurt/gofpdf"

	"net/smtp"
	"os"
)

func GenerarPDF(factura models.FacturaEnvio, uuid, autorizacion, serie string) (string, error) {

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Encabezado
	pdf.SetFillColor(27, 60, 83)
	pdf.Rect(0, 0, 210, 22, "F")
	pdf.SetTextColor(249, 243, 239)
	pdf.SetFont("Helvetica", "B", 15)
	pdf.SetXY(12, 8)
	pdf.Cell(100, 8, "LogiTrans - Factura Electronica")

	// Datos principales
	pdf.SetTextColor(27, 60, 83)
	pdf.SetFont("Helvetica", "", 10)
	pdf.SetXY(12, 26)
	pdf.Text(12, 26, fmt.Sprintf("No. Factura: %d", factura.ID))
	pdf.Text(12, 30, fmt.Sprintf("Fecha emision: %s", factura.Fecha))
	pdf.Text(12, 34, "Estado: Certificada")

	// Datos del cliente
	pdf.SetFont("Helvetica", "B", 10)
	pdf.Text(12, 40, "Datos del cliente")
	pdf.SetFont("Helvetica", "", 10)
	pdf.Text(12, 44, fmt.Sprintf("Cliente: %s", factura.Nombre))
	pdf.Text(12, 48, fmt.Sprintf("NIT: %s", factura.NIT))
	pdf.Text(12, 52, fmt.Sprintf("Direccion fiscal: %s", factura.DireccionFiscal))

	// Datos FEL
	pdf.SetFont("Helvetica", "B", 10)
	pdf.Text(12, 58, "Datos FEL")
	pdf.SetFont("Helvetica", "", 10)
	pdf.Text(12, 62, fmt.Sprintf("Autorizacion: %s", autorizacion))
	pdf.Text(12, 66, fmt.Sprintf("Serie: %s", serie))
	pdf.Text(12, 70, fmt.Sprintf("UUID: %s", uuid))

	// Totales
	pdf.SetFont("Helvetica", "", 10)
	pdf.Text(12, 80, fmt.Sprintf("Subtotal: Q %.2f", factura.Total))
	pdf.Text(12, 84, fmt.Sprintf("IVA (12%%): Q %.2f", factura.IVA))
	pdf.SetFont("Helvetica", "B", 10)
	pdf.Text(12, 88, fmt.Sprintf("Total: Q %.2f", factura.Total+factura.IVA))

	filePath := fmt.Sprintf("factura_%s.pdf", uuid)

	err := pdf.OutputFileAndClose(filePath)
	if err != nil {
		return "", err
	}

	return filePath, nil
}

func EnviarCorreoConPDF(destino, pdfPath string) error {

	from := "aydproyecto12@gmail.com"
	password := "lxqh lfin nzgp aapw"

	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	auth := smtp.PlainAuth("", from, password, smtpHost)

	file, err := os.ReadFile(pdfPath)
	if err != nil {
		return err
	}

	subject := "Factura FEL"
	body := "Adjunto encontrará su factura."

	// Codificar PDF en base64
	encodedPDF := base64.StdEncoding.EncodeToString(file)

	msg := "MIME-version: 1.0;\n" +
		"Content-Type: multipart/mixed; boundary=\"boundary\"\n\n" +

		"--boundary\n" +
		"Content-Type: text/plain; charset=\"UTF-8\"\n\n" +
		body + "\n\n" +

		"--boundary\n" +
		"Content-Type: application/pdf\n" +
		"Content-Transfer-Encoding: base64\n" +
		"Content-Disposition: attachment; filename=\"factura.pdf\"\n\n" +
		encodedPDF + "\n\n" +

		"--boundary--"

	err = smtp.SendMail(
		smtpHost+":"+smtpPort,
		auth,
		from,
		[]string{destino},
		[]byte("Subject: "+subject+"\n"+msg),
	)

	if err != nil {
		return err
	}

	fmt.Println("Correo enviado a:", destino)

	// Limpiar archivo temporal
	os.Remove(pdfPath)

	return nil
}
