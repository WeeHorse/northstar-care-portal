import { useEffect, useState } from "react";
import { api } from "../app/api";
import { useAuth } from "../app/auth";
import { ResourceTable } from "../components/ResourceTable";

export function RecordsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.listRecords(token).then((res) => setItems(res.items || [])).catch(() => setItems([]));
  }, [token]);

  return <ResourceTable title="Records" items={items} columns={[{ key: "id", label: "ID" }, { key: "patientRef", label: "Patient Ref" }, { key: "status", label: "Status" }, { key: "sensitivityLevel", label: "Sensitivity" }]} />;
}
