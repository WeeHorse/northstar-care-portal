import { useEffect, useState } from "react";
import { api } from "../app/api";
import { useAuth } from "../app/auth";
import { ResourceTable } from "../components/ResourceTable";

export function ProceduresPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.listProcedures(token).then((res) => setItems(res.items || [])).catch(() => setItems([]));
  }, [token]);

  return <ResourceTable title="Procedures" items={items} columns={[{ key: "id", label: "ID" }, { key: "title", label: "Title" }, { key: "category", label: "Category" }, { key: "classification", label: "Class" }]} />;
}
