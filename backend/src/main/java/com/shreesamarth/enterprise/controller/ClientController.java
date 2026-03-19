package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.dto.ClientDTO;
import com.shreesamarth.enterprise.entity.Client;
import com.shreesamarth.enterprise.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientRepository clientRepository;

    @GetMapping
    public ResponseEntity<List<ClientDTO>> getAllClients() {
        List<Client> clients = clientRepository.findAll();
        List<ClientDTO> dtos = clients.stream().map(this::toDTO).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientDTO> getClientById(@PathVariable Long id) {
        return clientRepository.findById(id)
                .map(client -> ResponseEntity.ok(toDTO(client)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ClientDTO> createClient(@RequestBody Client client) {
        Client saved = clientRepository.save(client);
        return ResponseEntity.ok(toDTO(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientDTO> updateClient(@PathVariable Long id, @RequestBody Client client) {
        return clientRepository.findById(id)
                .map(existing -> {
                    client.setId(id);
                    client.setCreatedAt(existing.getCreatedAt());
                    Client saved = clientRepository.save(client);
                    return ResponseEntity.ok(toDTO(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        if (clientRepository.existsById(id)) {
            clientRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    private ClientDTO toDTO(Client client) {
        return new ClientDTO(
            client.getId(),
            client.getPartyName(),
            client.getGstNumber(),
            client.getAddress(),
            client.getPhone(),
            client.getEmail(),
            client.getDieselProvidedByClient(),
            client.getCreatedAt()
        );
    }
}
