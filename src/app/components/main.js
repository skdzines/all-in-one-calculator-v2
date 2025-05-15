"use client"

import React, { Component } from 'react';
import Connect from './util/connect';
import moment from 'moment';

import { action as applicationAction } from '../store/application';

import '../sass/styles.scss';

const mapToProps = {
	state: ['application', 'api'],
	actions: { application: applicationAction }
}

export default Connect(
	class Main extends Component {
		constructor(props) {
			super(props);
			this.state = {
				LTV: .8,
				home_value: 701000,
				home_value_increase_per_year: 3.4,
				principal_balance: 329000,
				property_insurance: 2988,
				annual_taxes: 10000,
				monthly_withdrawals: 9000,
				interest_rate: 7.14,
				rate_adjustment: 0,
				inflation_rate: 2.5,
				cost_of_living_increase: 3,
				results: null,
				future_withdrawals: [],
				future_deposits: [],
				income: [
					{
						amount: 4111.76,
						frequency: '26',
						pay_date: moment(),
						deposit_schedule: []
					},
					{
						amount: 2541.24,
						frequency: '26',
						pay_date: moment(),
						deposit_schedule: []
					},
					{
						amount: 20000,
						frequency: '1',
						pay_date: moment("2026-02-15"),
						deposit_schedule: []
					},
					{
						amount: 1900,
						frequency: '4',
						pay_date: moment(),
						deposit_schedule: []
					}
				]
			}
		}

		formatCurrency = (number, currency = 'USD') => {
			return number.toLocaleString('US-EN', {style: 'currency', currency});
		}

		determineLeapYear = (year) => {
			return moment([year]).isLeapYear();
		}

		calculateMinimumPayment = (balance, interest_rate, date, daysInYear) => {
			const interest = [];
			let daysInMonth = moment(date).daysInMonth();
			let startDate = date;

			for(let i = 0, len = daysInMonth; i < len; i++) {
				let newDate = moment(startDate).add(i, 'days').format('YYYY-MM-DD');

				this.state.income.forEach(income => {
					if(income.deposit_schedule.includes(newDate)) {
						balance = balance - parseFloat(income.amount);
					}
				})
				const perDayInterest = (balance * (interest_rate/100) / daysInYear).toFixed(2);
				interest.push(perDayInterest);
			}

			return interest.reduce((a, b) => {
				return parseFloat(a) + parseFloat(b);
			});

		}

		calculateResults = (event) => {
			event.preventDefault();

			let date = moment().add(1, 'months').startOf('month').format();
			let currentYear = moment(date).format("YYYY");
			let balance = this.state.principal_balance;
			let deposits = parseInt(this.state.income.map(income => parseFloat(income.amount) * parseInt(income.frequency)).reduce((a, b) => a + b) / 12);
			let withdrawals = parseFloat(this.state.monthly_withdrawals);
			let interest_rate = this.state.interest_rate;
			let home_value = parseInt(this.state.home_value);

			const table = [];
			let interestPayments = [];
			let count = 1;

			if(deposits > withdrawals) {
				while(balance >= 0 && count < 360) {
					let leapYear = this.determineLeapYear(moment(currentYear));
					let daysInYear = leapYear ? 366 : 365;
					let newYear = moment(date).format("YYYY") !== currentYear;

					this.state.future_deposits.forEach(deposit => {
						if(parseInt(deposit.months_from_now) === count) {
							balance = balance - parseInt(deposit.amount);
						}
					});

					this.state.future_withdrawals.forEach(withdrawal => {
						if(parseInt(withdrawal.months_from_now) === count) {
							balance = balance + parseInt(withdrawal.amount);
						}
					});

					if(newYear) {
						interest_rate = parseFloat(interest_rate) + this.state.rate_adjustment;
						deposits = deposits * (this.state.cost_of_living_increase/100) + deposits;
						withdrawals = withdrawals * (this.state.inflation_rate/100) + withdrawals;
						home_value = home_value * (this.state.home_value_increase_per_year/100) + home_value;
					}

					const futureDeposit = this.state.future_deposits.filter(deposit => parseInt(deposit.months_from_now) === count);
					const futureWithdrawal = this.state.future_withdrawals.filter(withdrawal => parseInt(withdrawal.months_from_now) === count);

					let minimumPayment = this.calculateMinimumPayment(balance, interest_rate, date, daysInYear);
					interestPayments.push(minimumPayment);

					let taxesDue = moment(date).format("MMMM") === 'January' || moment(date).format("MMMM") === 'June';

					table.push(<tr key={'month-' + count}>
								<td>{count  + ` (${moment(date).format('MMM')})`}</td>
								<td>{this.formatCurrency(balance)}</td>
								<td>{futureDeposit.map((deposit, index) => {
									return <span key={`deposit-${index}`}>{`${this.formatCurrency(parseFloat(deposit.amount))} ${deposit.purpose.length ? `: ${deposit.purpose}` : ''}`}</span>;
								})}</td>
								<td>
									{taxesDue ? `(tax payment: ${parseFloat(this.state.annual_taxes/2)})` : ''}
									{futureWithdrawal.map((withdrawal, index) => {
										return <span key={`withdrawal-${index}`}>{`(${this.formatCurrency(parseFloat(withdrawal.amount))}) ${withdrawal.purpose.length ? `: ${withdrawal.purpose}` : ''}`}</span>;
									})}
								</td>
								<td>{this.formatCurrency(home_value * this.state.LTV - balance)}</td>
								<td>{this.formatCurrency(home_value - balance)}</td>
								<td>{this.formatCurrency(deposits)}</td>
								<td>{this.formatCurrency(withdrawals + minimumPayment)}</td>
								<td>{interest_rate + '%'}</td>
								<td>{this.formatCurrency(minimumPayment)}</td>
							</tr>);

					balance = balance - (deposits - withdrawals) + minimumPayment;
					date = moment(date).add(1, 'months').format("YYYY-MM-DD");
					if(taxesDue) {
						balance = balance + parseFloat(this.state.annual_taxes / 2);
					}
					if(newYear) {
						balance = balance + parseInt(this.state.property_insurance);
						currentYear = moment(date).format("YYYY");
					}

					count++;
				}

				const years = Math.floor((count-1) / 12);
				const months = (count-1) % 12;
				const averageMonthlyInterest = interestPayments.reduce((a, b) => a + b) / interestPayments.length;

				this.setState({
					results: <div>
							<h2>Loan will be paid off in {count-1} months. ({years} years and {months} months)</h2>
							<p>Average monthly interest payment: {this.formatCurrency(averageMonthlyInterest)}</p>
							<table>
								<thead>
									<tr>
										<th>Month</th>
										<th>Balance</th>
										<th>Future Deposit</th>
										<th>Future Draws</th>
										<th>Equity (LTV)</th>
										<th>Total Equity</th>
										<th>Deposits</th>
										<th>Withdrawals (Inc. Interest)</th>
										<th>Rate</th>
										<th>Interest Payment</th>
									</tr>
								</thead>
								<tbody>
									{table}
								</tbody>
							</table>
						</div>
				});
			} else {
				results: <div>Income must be greater than monthly expenses!</div>
			}

		}

		addFutureWithdrawal = (event) => {
			event.preventDefault();

			const newWithdrawals = this.state.future_withdrawals;
			newWithdrawals.push({
				amount: 0,
				months_from_now: 0,
				purpose: ''
			});

			this.setState({
				future_withdrawals: newWithdrawals
			});
		}

		addFutureDeposit = (event) => {
			event.preventDefault();

			const newDeposits = this.state.future_deposits;
			newDeposits.push({
				amount: 0,
				months_from_now: 0,
				purpose: ''
			});

			this.setState({
				future_deposits: newDeposits
			});
		}

		addIncome = (event) => {
			event.preventDefault();

			const newIncome = this.state.income;
			newIncome.push({
				amount: 0,
				frequency: '',
				pay_date: moment(),
				deposit_schedule: []
			});

			this.setState({
				income: newIncome
			});
		}

		updateState = (event) => {
			const newState = this.state;

			newState[event.target.id] = event.target.value;

			this.setState(newState);
		}

		updateFutureWithdrawal = (index, event) => {
			const newState = this.state.future_withdrawals;

			newState[index][event.target.id] = event.target.value;

			this.setState(newState);
		}

		updateFutureDeposit = (index, event) => {
			const newState = this.state.future_deposits;

			newState[index][event.target.id] = event.target.value;

			this.setState(newState);
		}

		setIncome = (index, event) => {
			const newState = this.state.income;

			newState[index][event.target.id] = event.target.value;

			if(newState[index].frequency.length) {
				const days = newState[index].frequency === '26' ? 14 : 7;
				let startDate = moment(newState[index].pay_date).format('YYYY-MM-DD');
				let schedule = [startDate];
				for(let i = 0, len = parseInt(newState[index].frequency) * 30; i < len; i++) {
					let newDate = startDate = moment(startDate).add(days, 'days').format('YYYY-MM-DD');
					schedule.push(newDate);
				}
				newState[index].deposit_schedule = schedule;
			}

			this.setState(newState);
		}

		removeItem = (state, index, event) => {
			event.preventDefault();
			const newState = state;
			
			newState.splice(index, 1);
			this.setState(newState);
		}

		render() {
			const { activeRequests } = this.props.api;
			const { initialized, posts } = this.props.application;

			return (
				<main>
					<form>
						<h2>Property Info:</h2>
						<div>
							<label>
								Home Value:
								<input type="number" id="home_value" value={this.state.home_value} onChange={this.updateState} />
							</label>
							<label>
								Mortgage Balance:
								<input type="number" id="principal_balance" value={this.state.principal_balance} onChange={this.updateState} />
							</label>
							<label>
								Annual Taxes:
								<input type="number" id="annual_taxes" value={this.state.annual_taxes} onChange={this.updateState} />
							</label>
							<label>
								Property Insurance:
								<input type="number" id="property_insurance" value={this.state.property_insurance} onChange={this.updateState} />
							</label>
						</div>
						<h2>Interest Rate:</h2>
						<div>
							<label> Rate:
								<input type="number" id="interest_rate" value={this.state.interest_rate} onChange={this.updateState} />
							</label>
						</div>
						<h2>Expenses:</h2>
						<div>
							
							<label>
								Monthly Withdrawals:
								<input type="number" id="monthly_withdrawals" value={this.state.monthly_withdrawals} onChange={this.updateState} />
							</label>
						</div>
						<section className="income">
							<h2>Income: {this.state.income.length ? this.formatCurrency(this.state.income.map(income => income.frequency ? parseFloat(income.amount) * parseInt(income.frequency) : 0).reduce((a, b) => a + b)) : null}</h2>
							{this.state.income.map((income, index) => {
								return <div key={`income-${index}`}>
									<label>
										Amount (Net):
										<input type="number" id="amount" value={income.amount} onChange={this.setIncome.bind(null, index)} />
									</label>
									<label>
										Frequency:
										<select onChange={this.setIncome.bind(null, index)} id="frequency" value={income.frequency}>
											<option value="">Select</option>
											<option value="52">Weekly</option>
											<option value="26">Bi-weekly</option>
											<option value="24">Semi-monthly</option>
											<option value="1">Annually</option>
											<option value="4">Quarterly</option>
											
											
										</select>
									</label>
									<label>
										Next pay date:
										<input type="date" id="pay_date" value={moment(income.pay_date).format('YYYY-MM-DD')} onChange={this.setIncome.bind(null, index)} />
									</label>
									<button onClick={this.removeItem.bind(null, this.state.income, index)}>Remove</button>
								</div>
							})}
							<button onClick={this.addIncome}>Add</button>
						</section>
						<section className="future-deposits">
							<h2>Future Deposits:</h2>
							{this.state.future_deposits.map((future, index) => {
								return <div key={`withdrawal-${index}`}>
									<label>
										Amount:
										<input type="number" id="amount" value={future.amount} onChange={this.updateFutureDeposit.bind(null, index)} />
									</label>
									<label>
										Months from now:
										<input type="number" id="months_from_now" value={future.months_from_now} onChange={this.updateFutureDeposit.bind(null, index)} />
									</label>
									<label>
										Purpose:
										<input type="text" id="purpose" value={future.purpose} onChange={this.updateFutureDeposit.bind(null, index)} />
									</label>
									<button onClick={this.removeItem.bind(null, this.state.future_deposits, index)}>Remove</button>
								</div>
							})}
							<button onClick={this.addFutureDeposit}>Add</button>
						</section>
						<section className="future-withdrawals">
							<h2>Future Withdrawals:</h2>
							{this.state.future_withdrawals.map((future, index) => {
								return <div key={`withdrawal-${index}`}>
									<label>
										Amount:
										<input type="number" id="amount" value={future.amount} onChange={this.updateFutureWithdrawal.bind(null, index)} />
									</label>
									<label>
										Months from now:
										<input type="number" id="months_from_now" value={future.months_from_now} onChange={this.updateFutureWithdrawal.bind(null, index)} />
									</label>
									<label>
										Purpose:
										<input type="text" id="purpose" value={future.purpose} onChange={this.updateFutureWithdrawal.bind(null, index)} />
									</label>
									<button onClick={this.removeItem.bind(null, this.state.future_withdrawals, index)}>Remove</button>
								</div>
							})}
							<button onClick={this.addFutureWithdrawal}>Add</button>
						</section>
						<button onClick={this.calculateResults}>Calculate</button>
					</form>

					{this.state.results}
				</main>
			);
		}
	},
	mapToProps
);
