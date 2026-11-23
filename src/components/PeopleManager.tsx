import { useState } from "react";
import type { Person } from "../core/types";

export type PeopleManagerProps = {
  people: Person[];
  onAddPerson: (name: string) => void;
  onRemovePerson: (id: string) => void;
};

export function PeopleManager({ people, onAddPerson, onRemovePerson }: PeopleManagerProps) {
  const [name, setName] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onAddPerson(name);
    setName("");
  };

  return (
    <div>
      <h2>People</h2>
      <form className="form-row" onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a person"
          className="input"
          aria-label="Person name"
        />
        <button type="submit" className="button button-primary">
          Add
        </button>
      </form>

      <ul className="chip-list">
        {people.map((person) => (
          <li key={person.id} className="chip">
            <span>{person.name}</span>
            <button
              type="button"
              className="chip-remove"
              onClick={() => onRemovePerson(person.id)}
              aria-label={`Remove ${person.name}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
