import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiDownload, FiPrinter } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { downloadLRPdf } from '../utils/lrPdf';
import { formatDate } from '../utils/formatters';

const money = (value) => (Number(value || 0) ? Number(value).toFixed(2) : '');
const addr = (customer) => [customer?.address, customer?.city, customer?.state, customer?.pincode].filter(Boolean).join(', ');

const FieldLine = ({ label, children, className = '' }) => (
  <div className={`lr-field ${className}`}>
    <span className="lr-label">{label}</span>
    <span className="lr-value">{children}</span>
  </div>
);

const Box = ({ label, children, className = '' }) => (
  <div className={`lr-box ${className}`}>
    <div className="lr-box-label">{label}</div>
    <div className="lr-box-value">{children}</div>
  </div>
);

const ConsignmentDetailsPage = () => {
  const { id } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ['consignment', id], queryFn: async () => (await api.get(`/consignments/${id}`)).data });
  if (isLoading) return <div className="text-sm text-slate-500">Loading LR details...</div>;

  const subtotal = Number(data.subTotal || 0) ||
    Number(data.freight || 0) +
    Number(data.collectionCharges || 0) +
    Number(data.doorDeliveryCharges || 0) +
    Number(data.hamali || 0) +
    Number(data.stCharges || 0) +
    Number(data.otherCharges || 0) +
    Number(data.insurance || 0);
  const sgst = Number(data.sgst || data.gst / 2 || 0);
  const cgst = Number(data.cgst || data.gst / 2 || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.lrNumber}
        description="One-page printed LR layout"
        action={<div className="flex flex-wrap gap-2 print:hidden">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 font-semibold text-white"><FiPrinter /> Print LR</button>
          <button onClick={() => downloadLRPdf(data)} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 font-semibold text-white"><FiDownload /> Download PDF</button>
        </div>}
      />

      <section className="overflow-auto rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 print:overflow-visible print:p-0 print:shadow-none print:ring-0">
        <div className="lr-sheet" id="lr-print">
          <div className="lr-header">
            <div className="lr-logo">TL</div>
            <div className="lr-company">
              <div className="lr-title">TANUSHREE LOGISTICS</div>
              <div>Branch Office :- BajajNagar, MIDC Waluj,</div>
              <div>Chhatrapati Sambhajinagar-431136. &nbsp;&nbsp; Mob. 9529384849, 9049152343</div>
              <div>E-mail.: tanushreelogistics09@gmail.com</div>
            </div>
            <div className="lr-number-block">
              <div>Date : <span>{formatDate(data.bookingDate)}</span></div>
              <div>Sr. No. : <strong>{data.lrNumber}</strong></div>
            </div>
          </div>

          <div className="lr-main-top">
            <div className="lr-party-block">
              <FieldLine label="Consignor : M/s">{data.consignerId?.companyName}</FieldLine>
              <FieldLine label="Add.">{addr(data.consignerId)}</FieldLine>
              <FieldLine label="GSTIN :">{data.consignerId?.gstNumber}</FieldLine>
              <FieldLine label="Consignee : M/s">{data.consigneeId?.companyName}</FieldLine>
              <FieldLine label="Add.">{addr(data.consigneeId)}</FieldLine>
              <FieldLine label="GSTIN :">{data.consigneeId?.gstNumber}</FieldLine>
            </div>
            <div className="lr-route-block">
              <Box label="Booking Mode">{data.bookingMode}</Box>
              <Box label="Mode of Delivery :">{data.modeOfDelivery}</Box>
              <Box label="FROM :">{data.tripId?.from}</Box>
              <Box label="TO :">{data.tripId?.to}</Box>
            </div>
          </div>

          <FieldLine label="Vehicle No.:">{data.tripId?.vehicleNumber}</FieldLine>

          <div className="lr-grid">
            <div className="lr-left-grid">
              <div className="lr-row lr-two">
                <Box label="Nos. of Pkgs:">{data.packageCount}</Box>
                <Box label="Types of Packing">{data.packageType}</Box>
              </div>
              <FieldLine label="In Words :">{data.remarks}</FieldLine>
              <FieldLine label="PART NO.:">{data.partNumber}</FieldLine>
              <FieldLine label="PART NAME :">{data.partName}</FieldLine>
              <div className="lr-row lr-two">
                <Box label="QTY:">{data.quantity}</Box>
                <Box label="PRIVATE MARK :">{data.privateMark}</Box>
              </div>
              <FieldLine label="E-WAY BILL NO:">{data.ewayBillNumber}</FieldLine>
              <FieldLine label="E-WAY BILL DATE:">{formatDate(data.ewayBillDate)}</FieldLine>
              <FieldLine label="VALID UPTO:">{formatDate(data.ewayBillValidUpto)}</FieldLine>
              <FieldLine label="INVOICE NO.:">{data.invoiceNumber}</FieldLine>
              <FieldLine label="INVOICE DATE:">{formatDate(data.invoiceDate)}</FieldLine>
              <FieldLine label="INVOICE VALUE:">{money(data.goodsValue)}</FieldLine>
            </div>

            <div className="lr-mid-grid">
              <Box label="Dimensions (lxbxh in inches)" className="lr-tall">{data.dimensions}</Box>
              <div className="lr-row lr-two">
                <Box label="Rate PER CFT"></Box>
                <Box label="Total CFT"></Box>
              </div>
              <div className="lr-weight">
                <div className="lr-section-title">WEIGHT</div>
                <div className="lr-row lr-two">
                  <Box label="Actual (Kg)">{data.actualWeight}</Box>
                  <Box label="Charged (Kg)">{data.chargeableWeight}</Box>
                </div>
              </div>
              <Box label="PAYMENT MODE">{data.paymentMode}</Box>
              <Box label="DELIVERY DATE:" className="lr-delivery">{formatDate(data.deliveryDate)}</Box>
            </div>

            <div className="lr-freight">
              <div className="lr-section-title">FREIGHT DETAILS</div>
              {[
                ['Freight', data.freight],
                ['Collection Charges', data.collectionCharges],
                ['Door Del Charges', data.doorDeliveryCharges],
                ['Hamali', data.hamali],
                ['St. Charges', data.stCharges],
                ['Other Charges', data.otherCharges],
                ['Sub Total', subtotal],
                ['SGST @      %', sgst],
                ['CGST @      %', cgst],
                ['IGST @      %', data.igst],
                ['Grand Total', data.totalAmount],
              ].map(([label, value]) => (
                <div key={label} className="lr-charge-row">
                  <span>{label}</span>
                  <span>{money(value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lr-footer-grid">
            <div className="lr-notes">
              <strong>GSTIN NO. 27IDHPM2784P1ZK</strong>
              <span>Get to be paid by consignor/consignee/Transporter &nbsp; * Packed Quantity Not Checked</span>
              <span>Not Responsible any leakage & breakage &nbsp; * Subject to Aurangabad Jurisdiction</span>
            </div>
            <div className="lr-ack">
              <strong>Consignment Acknowledgment by Consignee as per Details Contained here in</strong>
              <span>Signature</span>
              <span>Seal of the Company with date</span>
            </div>
            <div className="lr-clerk">Signature of Booking clerk</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ConsignmentDetailsPage;
