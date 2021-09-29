const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

/**
 * name - string
 * cpf - string
 * statement []
 * id - uuid
 */

app.post("/account", (request, response) => {
  const { name, cpf } = request.body;
  
  const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);

  if (customerAlreadyExists) {
    return response.status(400).json({ error: "Customer already Exists!"});
  }

  customers.push({
    name,
    cpf,
    id: uuidv4(),
    statement: []
  });

  return response.status(201).send();
});

app.get("/statement", (request, response) => {
  const { cpf } = request.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: "Customer not found!" });
  }

  return response.status(200).json(customer.statement);
});

app.listen(3333);