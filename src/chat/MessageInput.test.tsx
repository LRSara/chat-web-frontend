import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageInput } from "@/chat/MessageInput";

describe("MessageInput", () => {
  it("deve renderizar input de texto", () => {
    render(
      <MessageInput
        onSendText={vi.fn()}
        onSendImage={vi.fn()}
        onSendAudio={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText("Digite uma mensagem...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument();
  });

  it("deve chamar onSendText ao enviar mensagem", async () => {
    const onSendText = vi.fn();

    render(
      <MessageInput
        onSendText={onSendText}
        onSendImage={vi.fn()}
        onSendAudio={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText("Digite uma mensagem...");
    await userEvent.type(input, "Olá mundo");
    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(onSendText).toHaveBeenCalledWith("Olá mundo");
  });

  it("deve enviar ao pressionar Enter", async () => {
    const onSendText = vi.fn();

    render(
      <MessageInput
        onSendText={onSendText}
        onSendImage={vi.fn()}
        onSendAudio={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText("Digite uma mensagem...");
    await userEvent.type(input, "Teste{Enter}");

    expect(onSendText).toHaveBeenCalledWith("Teste");
  });

  it("não deve enviar mensagem vazia", async () => {
    const onSendText = vi.fn();

    render(
      <MessageInput
        onSendText={onSendText}
        onSendImage={vi.fn()}
        onSendAudio={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(onSendText).not.toHaveBeenCalled();
  });

  it("não deve enviar espaços em branco", async () => {
    const onSendText = vi.fn();

    render(
      <MessageInput
        onSendText={onSendText}
        onSendImage={vi.fn()}
        onSendAudio={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText("Digite uma mensagem...");
    await userEvent.type(input, "   ");
    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(onSendText).not.toHaveBeenCalled();
  });

  it("deve ter botão de enviar imagem", () => {
    render(
      <MessageInput
        onSendText={vi.fn()}
        onSendImage={vi.fn()}
        onSendAudio={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Enviar imagem")).toBeInTheDocument();
  });

  it("deve ter botão de gravar áudio", () => {
    render(
      <MessageInput
        onSendText={vi.fn()}
        onSendImage={vi.fn()}
        onSendAudio={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Gravar áudio")).toBeInTheDocument();
  });

  it("deve desabilitar input quando disabled", () => {
    render(
      <MessageInput
        onSendText={vi.fn()}
        onSendImage={vi.fn()}
        onSendAudio={vi.fn()}
        disabled
      />
    );

    expect(screen.getByPlaceholderText("Digite uma mensagem...")).toBeDisabled();
  });
});
