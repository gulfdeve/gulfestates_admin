
interface Props {
  attachments: {
    // floorPlan: string | null; // Commented out - Floor Plans removed
    masterPlan: string | null;
  };
  handleAttachmentChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "masterPlan" // "brochure" removed - Brochure is handled in BasicInformation, "floorPlan" removed - Floor Plans commented out
  ) => void;
}

export default function AttachmentsSection({
  attachments,
  handleAttachmentChange,
}: Props) {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Attachments</h2>
        <div className="grid grid-cols-3 gap-4">
        </div>
      </div>
    </>
  );
}
