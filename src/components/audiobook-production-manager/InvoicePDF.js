// src/components/production-manager/InvoicePDF.js
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
    objectFit: "contain",
    borderRadius: 4,
  },
  branding: { fontSize: 11, fontWeight: "bold", lineHeight: 1.4 },
  title: {
    fontSize: 32,
    fontWeight: "black",
    textTransform: "uppercase",
    letterSpacing: -1,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#64748b",
    marginTop: 2,
    textTransform: "uppercase",
  },
  // Dynamic header bar color based on type
  projectBar: {
    backgroundColor: "#0f172a",
    color: "#fff",
    padding: 12,
    marginBottom: 20,
    borderRadius: 4,
  },
  projectBarRefund: {
    backgroundColor: "#ef4444", // Red for refunds
    color: "#fff",
    padding: 12,
    marginBottom: 20,
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: 2,
    borderColor: "#0f172a",
    paddingBottom: 6,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#f1f5f9",
    paddingVertical: 10,
  },
  tableRowDeduction: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 10,
    color: "#ef4444",
  },
  totalSection: {
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalBox: {
    width: 200,
    borderTop: 2,
    borderColor: "#0f172a",
    paddingTop: 10,
  },
  grandTotal: { fontSize: 18, fontWeight: "bold", color: "#059669" },
  grandTotalRefund: { fontSize: 18, fontWeight: "bold", color: "#ef4444" }, // Red total for refunds
  payLink: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  payButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    backgroundColor: "#2563eb",
    borderRadius: 6,
    textAlign: "center",
  },
  payText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  noteSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
  },
  footer: {
    marginTop: "auto",
    borderTop: 1,
    borderColor: "#e2e8f0",
    paddingTop: 15,
    fontSize: 8,
    color: "#94a3b8",
  },
});

export default function InvoicePDF({ project, data, calcs }) {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);

  const sanitizeUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  const getRealTime = (decimalHours) => {
    if (!decimalHours) return "00:00:00";
    const totalSeconds = Math.floor(Number(decimalHours) * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const logoSrc = data.logo_url || "https://placehold.co/150x150?text=LOGO";

  // --- DETERMINE MODE ---
  const isDepositInvoice = data.is_deposit === true;
  const isRefundInvoice = data.is_refund === true; // NEW: Refund Mode

  const showDepositDeduction =
    !isDepositInvoice &&
    !isRefundInvoice &&
    data.deposit_status === "paid" &&
    Number(data.deposit_amount) > 0;

  // Calculate Amounts
  let amountDue = 0;
  let title = "INVOICE";
  let subtitle = "";
  let barStyle = styles.projectBar;

  if (isRefundInvoice) {
    title = "CREDIT MEMO";
    subtitle = `REFUND ISSUED (${data.refund_percentage}%)`;
    barStyle = styles.projectBarRefund;
    amountDue = calcs.refundTotal; // Passed from parent
  } else if (isDepositInvoice) {
    title = "DEPOSIT";
    subtitle = "UPFRONT PAYMENT";
    amountDue = calcs.total; // The total passed is the deposit amount
  } else {
    amountDue = calcs.finalDue || calcs.total;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Image src={logoSrc} style={styles.logo} />
            <Text style={styles.branding}>DnDL Creative LLC</Text>
            <Text>DBA Daniel (not Day) Lewis</Text>
            <Text>6809 Main St. #1118</Text>
            <Text>Cincinnati, Ohio 45244</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={[styles.title, isRefundInvoice && { color: "#ef4444" }]}
            >
              {title}
            </Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            <Text style={{ marginTop: 5, fontWeight: "bold" }}>
              Ref #: {project.ref_number || "N/A"}
            </Text>
            <Text>
              Date:{" "}
              {isDepositInvoice || isRefundInvoice
                ? new Date().toLocaleDateString()
                : data.invoiced_date}
            </Text>
          </View>
        </View>

        <View style={barStyle}>
          <Text style={{ fontSize: 12, fontWeight: "bold" }}>
            PROJECT: {project.book_title}
          </Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={{ flex: 3, fontWeight: "bold" }}>Description</Text>
          <Text style={{ flex: 1, textAlign: "right", fontWeight: "bold" }}>
            {isRefundInvoice ? "%" : isDepositInvoice ? "" : "Qty/Hrs"}
          </Text>
          <Text style={{ flex: 1, textAlign: "right", fontWeight: "bold" }}>
            {isRefundInvoice ? "Basis" : "Rate"}
          </Text>
          <Text style={{ flex: 1, textAlign: "right", fontWeight: "bold" }}>
            Total
          </Text>
        </View>

        {/* --- REFUND MODE --- */}
        {isRefundInvoice && (
          <View style={styles.tableRow}>
            <Text style={{ flex: 3 }}>
              Refund of Deposit ({data.refund_percentage}% of Paid Amount)
            </Text>
            <Text style={{ flex: 1, textAlign: "right" }}>
              {data.refund_percentage}%
            </Text>
            <Text style={{ flex: 1, textAlign: "right" }}>
              {formatCurrency(data.deposit_amount)}
            </Text>
            <Text style={{ flex: 1, textAlign: "right", color: "#ef4444" }}>
              -{formatCurrency(amountDue)}
            </Text>
          </View>
        )}

        {/* --- DEPOSIT MODE --- */}
        {isDepositInvoice && (
          <View style={styles.tableRow}>
            <Text style={{ flex: 3 }}>
              Audiobook Production Deposit (Non-Refundable)
            </Text>
            <Text style={{ flex: 1, textAlign: "right" }}>-</Text>
            <Text style={{ flex: 1, textAlign: "right" }}>-</Text>
            <Text style={{ flex: 1, textAlign: "right" }}>
              {formatCurrency(amountDue)}
            </Text>
          </View>
        )}

        {/* --- STANDARD MODE --- */}
        {!isDepositInvoice && !isRefundInvoice && (
          <>
            {/* 1. Base PFH */}
            <View style={styles.tableRow}>
              <Text style={{ flex: 3 }}>
                Audiobook Production (Performance)
              </Text>
              <Text style={{ flex: 1, textAlign: "right" }}>
                {Number(data.pfh_count).toFixed(2)}
              </Text>
              <Text style={{ flex: 1, textAlign: "right" }}>
                {formatCurrency(data.pfh_rate)}
              </Text>
              <Text style={{ flex: 1, textAlign: "right" }}>
                {formatCurrency(calcs.base)}
              </Text>
            </View>

            {/* 2. SAG */}
            {Number(calcs.sag) > 0 && (
              <View style={styles.tableRow}>
                <Text style={{ flex: 3 }}>
                  SAG-AFTRA P&H Contribution ({data.sag_ph_percent}%)
                </Text>
                <Text style={{ flex: 1, textAlign: "right" }}>-</Text>
                <Text style={{ flex: 1, textAlign: "right" }}>-</Text>
                <Text style={{ flex: 1, textAlign: "right" }}>
                  {formatCurrency(calcs.sag)}
                </Text>
              </View>
            )}

            {/* 3. Convenience Fee */}
            {Number(data.convenience_fee) > 0 && (
              <View style={styles.tableRow}>
                <Text style={{ flex: 3 }}>Multi-Performer / Admin Fee</Text>
                <Text style={{ flex: 1, textAlign: "right" }}>-</Text>
                <Text style={{ flex: 1, textAlign: "right" }}>-</Text>
                <Text style={{ flex: 1, textAlign: "right" }}>
                  {formatCurrency(data.convenience_fee)}
                </Text>
              </View>
            )}

            {/* 4. DYNAMIC LINE ITEMS */}
            {(data.line_items || []).map((item, index) => (
              <View style={styles.tableRow} key={index}>
                <Text style={{ flex: 3 }}>{item.description}</Text>
                <Text style={{ flex: 1, textAlign: "right" }}>-</Text>
                <Text style={{ flex: 1, textAlign: "right" }}>-</Text>
                <Text style={{ flex: 1, textAlign: "right" }}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}

            {/* 5. DEPOSIT DEDUCTION (If Paid) */}
            {showDepositDeduction && (
              <View style={styles.tableRowDeduction}>
                <Text style={{ flex: 3, fontStyle: "italic" }}>
                  Less: Deposit Paid
                </Text>
                <Text style={{ flex: 1, textAlign: "right" }}>-</Text>
                <Text style={{ flex: 1, textAlign: "right" }}>-</Text>
                <Text style={{ flex: 1, textAlign: "right" }}>
                  -{formatCurrency(data.deposit_amount)}
                </Text>
              </View>
            )}
          </>
        )}

        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontWeight: "bold" }}>
                {isRefundInvoice ? "TOTAL REFUND:" : "TOTAL DUE:"}
              </Text>
              <Text
                style={
                  isRefundInvoice ? styles.grandTotalRefund : styles.grandTotal
                }
              >
                {isRefundInvoice ? "-" : ""}
                {formatCurrency(amountDue)}
              </Text>
            </View>
          </View>
        </View>

        {data.payment_link && !isRefundInvoice && (
          <View style={styles.payLink}>
            <Link
              src={sanitizeUrl(data.payment_link)}
              style={{ textDecoration: "none" }}
            >
              <View style={styles.payButton}>
                <Text style={styles.payText}>Click to Pay Online</Text>
              </View>
            </Link>
          </View>
        )}

        {!isDepositInvoice && !isRefundInvoice && (
          <View style={styles.noteSection}>
            <Text
              style={{
                fontSize: 8,
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              Notes
            </Text>
            <Text>Real Audio Runtime: {getRealTime(data.pfh_count)}</Text>
            {data.custom_note && (
              <Text style={{ marginTop: 5 }}>{data.custom_note}</Text>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text>
            {isDepositInvoice
              ? "Deposit is required before production begins."
              : isRefundInvoice
                ? "This refund has been processed to your original payment method."
                : `NET 15: Payment due by ${data.due_date || "TBD"}.`}{" "}
            Thank you for your business.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
