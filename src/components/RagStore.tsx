import { useEffect, useState } from "react";

interface Collection {
  name: string;
}

interface CollectionDetails {
  status: string;
  vectors_count: number;
  config: any;
}

interface Point {
  id: string | number;
  payload?: any;
}

export default function RagStore({
  refresh,
  onSelectChange,
}: {
  refresh: boolean;
  onSelectChange: (collections: string[]) => void;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [openCollection, setOpenCollection] = useState<string | null>(null);
  const [details, setDetails] = useState<CollectionDetails | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch collections on load or refresh
  useEffect(() => {
    fetch("http://localhost:6333/collections")
      .then((res) => res.json())
      .then((data) => {
        if (data.result?.collections) {
          const fetched = data.result.collections;
          setCollections(fetched);

          // automatically select newly added collections
          const fetchedNames = fetched.map((c: any) => c.name);
          setSelectedCollections((prev) => {
            const newSelection = [...new Set([...prev, ...fetchedNames])];
            onSelectChange(newSelection);
            return newSelection;
          });
        }
      })
      .catch(console.error);
  }, [refresh]);

  // Toggle selection for one collection
  const toggleSelect = (name: string) => {
    setSelectedCollections((prev) => {
      const updated = prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name];
      onSelectChange(updated);
      return updated;
    });
  };

  // Select all / deselect all
  const toggleSelectAll = () => {
    setSelectedCollections((prev) => {
      const updated =
        prev.length === collections.length
          ? []
          : collections.map((c) => c.name);
      onSelectChange(updated);
      return updated;
    });
  };

  // Handle clicking a collection to show details
  const handleToggle = async (name: string) => {
    if (openCollection === name) {
      setOpenCollection(null);
      setDetails(null);
      setPoints([]);
      setSources([]);
      return;
    }

    setOpenCollection(name);
    setLoading(true);
    setDetails(null);
    setPoints([]);
    setSources([]);

    try {
      const metaRes = await fetch(`http://localhost:6333/collections/${name}`);
      const metaData = await metaRes.json();
      if (metaData.result) setDetails(metaData.result);

      const pointsRes = await fetch(
        `http://localhost:6333/collections/${name}/points/scroll`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 100, with_payload: true }),
        }
      );
      const pointsData = await pointsRes.json();
      if (pointsData.result?.points) {
        setPoints(pointsData.result.points);

        const uniqueSources = [
          ...new Set(
            pointsData.result.points
              .map((p) => p.payload?.sourceId)
              .filter(Boolean)
          ),
        ];
        setSources(uniqueSources);
      }
    } catch (err) {
      console.error("Failed to fetch collection details", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete with confirmation
  const handleDelete = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the collection "${name}"?`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:6333/collections/${name}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Collection deleted successfully");
        setCollections((prev) => prev.filter((c) => c.name !== name));
        setSelectedCollections((prev) => {
          const updated = prev.filter((n) => n !== name);
          onSelectChange(updated);
          return updated;
        });
        setOpenCollection(null);
        setDetails(null);
        setPoints([]);
        setSources([]);
      } else {
        alert("Failed to delete collection");
      }
    } catch (err) {
      console.error("Delete failed", err);
      alert("Error while deleting collection");
    }
  };

  return (
    <section className="bg-black/50 rounded-2xl p-4 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">RAG Store</h2>
        <button
          onClick={toggleSelectAll}
          className="py-1 px-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold text-white text-sm"
        >
          {selectedCollections.length === collections.length
            ? "Deselect All"
            : "Select All"}
        </button>
      </div>
      <ul className="space-y-2">
        {collections.map((collection) => (
          <li
            key={collection.name}
            className="text-gray-300 transition hover:bg-black/30 rounded-xl p-3 cursor-pointer border-indigo-500 hover:border-cyan-500"
          >
            <div className="flex justify-between items-center cursor-pointer hover:text-cyan-400">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedCollections.includes(collection.name)}
                onChange={() => toggleSelect(collection.name)}
                onClick={(e) => e.stopPropagation()}
                className="mr-2"
              />

              {/* Collection name click to expand */}
              <span
                className="flex-1"
                onClick={() => handleToggle(collection.name)}
              >
                {collection.name}
              </span>

              <button
                onClick={(e) => handleDelete(collection.name, e)}
                className="py-1 px-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-white text-sm"
              >
                Delete
              </button>
            </div>

            {openCollection === collection.name && (
              <div className="mt-3 bg-black/40 p-4 rounded-xl border border-white/10">
                {loading && <p className="text-gray-400">Loading details...</p>}

                {!loading && details && (
                  <>
                    {sources.length > 0 && (
                      <>
                        <h3 className="text-lg font-semibold text-cyan-400">
                          Sources
                        </h3>
                        <ul className="list-disc list-inside text-gray-300 mb-4">
                          {sources.map((src) => (
                            <li key={src}>{src}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    <h3 className="text-lg font-semibold text-cyan-400">
                      Content
                    </h3>
                    {points.length > 0 ? (
                      points.map((point) => (
                        <pre
                          key={point.id}
                          className="bg-black/30 p-2 rounded mt-2 text-xs overflow-x-auto"
                        >
                          {JSON.stringify(point.payload, null, 2)}
                        </pre>
                      ))
                    ) : (
                      <p className="text-gray-400">No sample points found</p>
                    )}
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
