package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.dto.ClientDTO;
import com.shreesamarth.enterprise.entity.Client;
import com.shreesamarth.enterprise.repository.BillRepository;
import com.shreesamarth.enterprise.repository.ClientRepository;
import com.shreesamarth.enterprise.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientRepository clientRepository;
    private final BillRepository billRepository;
    private final TripRepository tripRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<ClientDTO>> getAllClients() {
        List<Client> clients = clientRepository.findAll();
        List<ClientDTO> dtos = clients.stream().map(this::toDTO).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
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
    @Transactional
    public ResponseEntity<?> deleteClient(@PathVariable Long id) {
        if (!clientRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        int billCount = billRepository.findByClientId(id).size();
        int tripCount = tripRepository.findByClientId(id).size();

        if (billCount > 0 || tripCount > 0) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Cannot delete client with existing records",
                "bills", billCount,
                "trips", tripCount
            ));
        }

        clientRepository.deleteById(id);
        return ResponseEntity.ok().build();
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
