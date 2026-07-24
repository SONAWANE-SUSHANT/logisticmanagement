const formatDateForExcel = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN');
};

const currentDateStamp = () => new Date().toISOString().slice(0, 10);

export const mapConsignmentsForExcel = (consignments = []) =>
  consignments.map((item) => ({
    'LR Number': item.lrNumber || '',
    'Booking Date': formatDateForExcel(item.bookingDate),
    Consigner: item.consignerId?.companyName || '',
    Consignee: item.consigneeId?.companyName || '',
    'Vehicle Number': item.tripId?.vehicleNumber || '',
    Weight: Number(item.chargeableWeight || item.actualWeight || 0),
    Freight: Number(item.freight || 0),
    Status: item.status || '',
  }));

export const exportConsignmentsToExcel = async (consignments = []) => {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(mapConsignmentsForExcel(consignments));
  const workbook = XLSX.utils.book_new();
  worksheet['!cols'] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 28 },
    { wch: 28 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Consignments');
  XLSX.writeFile(workbook, `Consignments_${currentDateStamp()}.xlsx`);
};
