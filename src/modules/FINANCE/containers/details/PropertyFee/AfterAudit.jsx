// 财务管理 - 物业费明细
import React from 'react'
import {Row, Col, Modal} from 'antd'
import '../../style/test.less'
import { apiPost } from '../../../../../api'


class AfterAudit extends React.Component {
    constructor (props) {
        super(props)
        this.state = {
            visible: false,
            auditStatus: 2,
            payPeriod: '',
            remark: '',
            view: true,
            monthDay: 0,
            isFirst: true,
            data: {}
        }
    }
    async initialRemarks (nextProps) {
        this.setState({
            view: false
        })
        if (this.state.isFirst && nextProps.visible) {
            let resulData = await apiPost(
                '/propertyFee/getPropertyFeeById',
                {id: nextProps.id}
            )
            if (Math.floor(resulData.data.days) === resulData.data.days) {
                this.setState({
                    monthDay: resulData.data.days,
                    visible: nextProps.visible,
                    data: resulData.data,
                    isFirst: false,
                    view: true,
                    fileList: []
                })
            } else {
                this.setState({
                    monthDay: parseFloat(resulData.data.days).toFixed(5),
                    visible: nextProps.visible,
                    data: resulData.data,
                    isFirst: false,
                    view: true,
                    fileList: []
                })
            }
        }
    }
    componentWillReceiveProps (nextProps) {
        this.initialRemarks(nextProps)
    }
    onChange = (e) => {
        this.setState({
            auditStatus: e.target.value
        })
    }
    clientNameChange = (e) => {
    }
    handleCancel = (e) => {
        this.isFirst = true
        this.setState({ visible: false,
            isFirst: true})
    }
    render () {
        return (
            <Modal maskClosable={false}
                title= "物业费明细"
                style={{top: 20}}
                width={700}
                visible={this.state.visible}
                footer={null}
                onCancel={this.handleCancel}
            >
                <Row style={{marginTop: 50}}>
                    <Col>
                        <div style={{textAlign: 'center',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            lineHeight: '40px'}}
                        >
                            <span>
                                <input style={{width: '300px',
                                    height: '25px'}} value={this.state.data.clientName} onChange={this.clientNameChange}
                                /></span>
                            <span>物业服务费统计表</span>
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <div style={{color: '#666',
                            textAlign: 'center',
                            fontSize: '14px',
                            lineHeight: '18px'}}
                        >
                            （ {this.state.data.startDate} ~ {this.state.data.endDate} ）
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col span={8}><i>房间编号：</i>{this.state.data.roomNum} </Col>
                    <Col span={8}><i>所在楼宇：</i>{this.state.data.buildName} </Col>
                    <Col span={8}><i>交费期限：</i>{this.state.data.payDeadline} </Col>
                </Row>
                <table className="tb">
                    <tbody>
                        <tr className="hd">
                            <td>费用项目</td>
                            <td>面积</td>
                            <td />
                            <td>单价</td>
                            <td />
                            <td>月份</td>
                            <td>金额</td>
                        </tr>
                        <tr>
                            <td>物业管理费</td>
                            <td>{this.state.data.serviceArea}</td>
                            <td>*</td>
                            <td>{this.state.data.pmUnitPrice}</td>
                            <td>*</td>
                            <td>{this.state.monthDay}</td>
                            <td>{this.state.data.pmFee}</td>
                        </tr>
                        <tr>
                            <td>电梯费</td>
                            <td>{this.state.data.serviceArea}</td>
                            <td>*</td>
                            <td>{this.state.data.elevUnitPrice}</td>
                            <td>*</td>
                            <td>{this.state.monthDay}</td>
                            <td>{this.state.data.elevatorFee}</td>
                        </tr>
                        <tr>
                            <td>空调费</td>
                            <td>{this.state.data.serviceArea}</td>
                            <td>*</td>
                            <td>{this.state.data.acUnitPrice}</td>
                            <td>*</td>
                            <td>{this.state.monthDay}</td>
                            <td>{this.state.data.airFee}</td>
                        </tr>
                        <tr>
                            <td>水费</td>
                            <td>{this.state.data.serviceArea}</td>
                            <td>*</td>
                            <td>{this.state.data.waterUnitPrice}</td>
                            <td>*</td>
                            <td>{this.state.monthDay}</td>
                            <td>{this.state.data.waterFee}</td>
                        </tr>
                    </tbody>
                </table>
                <p style={{margin: '20px 0',
                    textAlign: 'right'}}
                >优惠金额  ¥{this.state.data.discountMoney} 本期应收 ¥{this.state.data.actualPaidMoney}</p>

                <div className="wrapbox">
                    <div className="main">
                        <p className="line" />
                        <h2>其他信息</h2>
                        <Row>
                            <Col span={8}><i>录入日期：</i>{this.state.data.createName}&nbsp;&nbsp;{this.state.data.createDate}</Col>
                            <Col span={16}><i>最后修改：</i>{this.state.data.undateName}&nbsp;&nbsp;{this.state.data.updateDate}</Col>
                        </Row>
                        <Row>
                            <Col span={8}><b>审核人：</b>{this.state.data.auditName}&nbsp;&nbsp;{this.state.data.auditDate}</Col>
                            <Col span={16}><b>审核说明：</b>{this.state.data.remark}</Col>
                        </Row>
                    </div>
                </div>
            </Modal>
        )
    }
}

export default AfterAudit

