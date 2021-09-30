const { request } = require("express");
const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

// Middleware
function verifyIfExistsAccountByCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: "Customer not found!" });
  }

  request.customer = customer;
  
  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acumulator, operation) => {
    if (operation.type === 'credit') {
      return acumulator + operation.amount;
    } else {
      return acumulator - operation.amount;
    }
  }, 0);

  return balance;
}

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

app.get("/statement", verifyIfExistsAccountByCPF, (request, response) => {
  const { customer } = request;

  return response.status(200).json(customer.statement);
});

app.post("/deposit", verifyIfExistsAccountByCPF, (request, response) => {
  const { description, amount } = request.body;
  const { customer } = request;
  
  const statementOperation = {
    description,
    amount,
    create_at: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
})

app.post("/withdraw", verifyIfExistsAccountByCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: "Saldo Insuficiente" });
  }

  const statementOperation = {
    amount,
    create_at: new Date(),
    type: "withdraw",
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
})

app.get("/statement/date", verifyIfExistsAccountByCPF, (request, response) => {
  const { date} = request.query;
  const { customer } = request;

  const dateFormat = new Date(date + " 00:00");
  
  const statement = customer.statement.filter(
    (statement) => statement.create_at.toDateString() 
    === new Date(dateFormat).toDateString());

  return response.status(200).json(statement);
});

app.put ("/account", verifyIfExistsAccountByCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
});


app.get("/account", verifyIfExistsAccountByCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.delete("/account", verifyIfExistsAccountByCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(200).json(customers);
})

app.get("/balance", verifyIfExistsAccountByCPF, (request, response) => {
  const { customer }= request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
})

app.listen(3333);