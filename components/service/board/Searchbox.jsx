"use client";

import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";

export default function Searchbox() {
  return (
    <InputGroup className="max-w-48">
      <InputGroupInput placeholder="검색하기" />
      <InputGroupButton
        /*
        onClick={() => setIsFavorite(!isFavorite)}
        */
        size="icon-sm"
      >
        <Search />
      </InputGroupButton>
    </InputGroup>
  );
}
