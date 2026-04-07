import { useEffect, useState } from "react";
import { api } from "../app/api";
import { useAuth } from "../app/auth";
import { ResourceTable } from "../components/ResourceTable";

export function DocumentsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.listDocuments(token).then((res) => setItems(res.items || [])).catch(() => setItems([]));
  }, [token]);

  return <ResourceTable title="Documents" items={items} columns={[{ key: "id", label: "ID" }, { key: "title", label: "Title" }, { key: "classification", label: "Class" }, { key: "category", label: "Category" }]} />;
}
