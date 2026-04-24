import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCookbook, editCookbook } from "../../api/cookbooks";
import type { Cookbook } from "../../../types/types";
import CookbookForm from "../../components/CookbookForm";
import { PageHeader } from "../../components/ui/PageHeader";
import { AppButton } from "../../components/ui/AppButton";
import { StatusBanner } from "../../components/ui/StatusBanner";

export default function CookbookEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCookbook = async () => {
      try {
        const data = await getCookbook(Number(id));
        setCookbook(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load cookbook");
      } finally {
        setLoading(false);
      }
    };

    fetchCookbook();
  }, [id]);

  const handleUpdate = async (updated: Partial<Cookbook>) => {
    if (!id || !cookbook) return;

    setSubmitError(null);

    try {
      const fullCookbook: Cookbook = {
        ...cookbook,
        ...updated,
        id: Number(id),
      };

      await editCookbook(fullCookbook);
      navigate(`/cookbook/${id}`);
    } catch (err) {
      console.error("Failed to update cookbook", err);
      setSubmitError("Failed to update cookbook.");
    }
  };

  if (loading) return <p className="py-6 text-sm text-[var(--text-secondary)]">Loading cookbook...</p>;
  if (error) return <p className="app-text-danger py-6 text-sm">{error}</p>;
  if (!cookbook) return <p className="py-6 text-sm text-[var(--text-secondary)]">Cookbook not found</p>;

  return (
    <div className="py-6 max-w-4xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Edit"
        title="Edit Cookbook"
        description="Update the cookbook name or categories without changing its recipes or sharing rules."
        actions={
          <Link to={`/cookbook/${id}`}>
            <AppButton>Cancel</AppButton>
          </Link>
        }
      />

      {submitError ? (
        <StatusBanner tone="danger" role="alert">
          {submitError}
        </StatusBanner>
      ) : null}

      <CookbookForm
        initialData={cookbook}
        onSubmit={handleUpdate}
        submitLabel="Save Changes"
      />
    </div>
  );
}
